import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Salesforce-specific callback patterns that indicate true positives
const SALESFORCE_POSITIVE_INDICATORS = {
  userAgents: [
    'salesforce',
    'sfdc',
    'lightning',
    'aura',
    'visualforce',
    'apex',
    'chatter',
    'force.com'
  ],
  ipPatterns: [
    // Salesforce IP ranges (partial list)
    '96.43.144.',
    '96.43.145.',
    '96.43.146.',
    '136.146.',
    '136.147.',
    '13.110.',
    '13.111.',
    '185.79.140.',
    '185.79.141.',
  ],
  headers: [
    'x-sfdc-request-id',
    'x-sfdc-page-scope-id',
    'salesforce-instance-url'
  ],
  // Patterns that indicate false positives
  falsePositivePatterns: [
    'googlebot',
    'bingbot',
    'yandexbot',
    'baiduspider',
    'crawler',
    'spider',
    'scraper',
    'headless',
    'phantomjs',
    'selenium',
    'puppeteer',
    'playwright'
  ]
};

// Severity mapping for vulnerability types
const VULN_SEVERITY_MAP: Record<string, string> = {
  'soql_injection': 'critical',
  'sosl_injection': 'high',
  'apex_injection': 'critical',
  'lightning_xss': 'high',
  'aura_component': 'high',
  'lwc_security': 'medium',
  'sharing_bypass': 'critical',
  'fls_bypass': 'high',
  'crud_bypass': 'critical',
  'open_redirect': 'medium',
  'ssrf': 'critical',
  'idor': 'high',
  'csrf': 'medium',
  'api_exposure': 'low',
  'guest_user_abuse': 'critical',
  'community_exposure': 'high',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestHeaders = Object.fromEntries(req.headers);
    const { 
      token, 
      callback_type = 'http', 
      source_ip, 
      user_agent,
      additional_context 
    } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Callback received for token: ${token}`);

    // Find the injection by token
    const { data: injection, error: injectionError } = await supabase
      .from('injections')
      .select('*, endpoints(*, targets(*))')
      .eq('token', token)
      .maybeSingle();

    if (injectionError) {
      console.error('Injection lookup error:', injectionError);
      throw injectionError;
    }

    if (!injection) {
      console.log('No injection found for token:', token);
      return new Response(
        JSON.stringify({ error: 'Invalid token', token }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get actual values from request if not provided
    const actualSourceIp = source_ip || req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const actualUserAgent = user_agent || req.headers.get('user-agent') || 'unknown';

    // Calculate delay since injection
    const injectedAt = injection.injected_at || injection.created_at;
    const delaySeconds = Math.floor((Date.now() - new Date(injectedAt).getTime()) / 1000);

    // Advanced confidence calculation with false positive filtering
    const confidenceResult = calculateSalesforceConfidence(
      actualUserAgent,
      actualSourceIp,
      delaySeconds,
      callback_type,
      requestHeaders,
      injection.context_type,
      additional_context
    );

    // If it's a false positive, log and skip finding creation
    if (confidenceResult.isFalsePositive) {
      await supabase.from('scan_logs').insert({
        target_id: injection.endpoints?.targets?.id,
        level: 'info',
        message: `🚫 False positive filtered: ${token} | Reason: ${confidenceResult.falsePositiveReason}`
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          filtered: true, 
          reason: confidenceResult.falsePositiveReason 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create callback record
    const { data: callback, error: callbackError } = await supabase
      .from('callbacks')
      .insert({
        injection_id: injection.id,
        callback_type,
        source_ip: actualSourceIp,
        user_agent: actualUserAgent,
        delay_seconds: delaySeconds,
        confidence: confidenceResult.confidence,
        raw_data: { 
          token, 
          headers: requestHeaders,
          confidence_factors: confidenceResult.factors,
          salesforce_indicators: confidenceResult.salesforceIndicators,
          additional_context
        }
      })
      .select()
      .single();

    if (callbackError) throw callbackError;

    // Update injection status
    await supabase
      .from('injections')
      .update({ status: 'callback_received' })
      .eq('id', injection.id);

    // Create finding for medium or higher confidence
    if (['high', 'medium'].includes(confidenceResult.confidence)) {
      await supabase
        .from('endpoints')
        .update({ status: 'vulnerable' })
        .eq('id', injection.endpoint_id);

      const vulnType = injection.context_type || 'unknown';
      const severity = VULN_SEVERITY_MAP[vulnType] || 'medium';

      // Create detailed finding
      await supabase.from('findings').insert({
        endpoint_id: injection.endpoint_id,
        callback_id: callback.id,
        title: generateFindingTitle(vulnType, injection.param),
        description: generateFindingDescription(vulnType, injection.endpoints?.endpoint, delaySeconds),
        severity,
        evidence: {
          token,
          delay: `${delaySeconds}s`,
          user_agent: actualUserAgent,
          source_ip: actualSourceIp,
          confidence: confidenceResult.confidence,
          confidence_score: confidenceResult.score,
          salesforce_indicators: confidenceResult.salesforceIndicators,
          callback_type,
          param: injection.param,
          endpoint: injection.endpoints?.endpoint,
          vuln_type: vulnType
        }
      });

      // Log successful detection
      await supabase.from('scan_logs').insert({
        target_id: injection.endpoints?.targets?.id,
        level: 'success',
        message: `🎯 CONFIRMED: ${vulnType.toUpperCase()} in ${injection.param} | Confidence: ${confidenceResult.confidence} (${confidenceResult.score}/10) | Delay: ${delaySeconds}s`
      });
    } else {
      // Low confidence - log for review
      await supabase.from('scan_logs').insert({
        target_id: injection.endpoints?.targets?.id,
        level: 'warn',
        message: `⚠️ Low confidence callback: ${token} | Score: ${confidenceResult.score}/10 | Needs manual review`
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        callback_id: callback.id, 
        confidence: confidenceResult.confidence,
        score: confidenceResult.score
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface ConfidenceResult {
  confidence: 'high' | 'medium' | 'low';
  score: number;
  factors: string[];
  salesforceIndicators: string[];
  isFalsePositive: boolean;
  falsePositiveReason?: string;
}

function calculateSalesforceConfidence(
  userAgent: string,
  sourceIp: string,
  delaySeconds: number,
  callbackType: string,
  headers: Record<string, string>,
  vulnType: string | null,
  additionalContext?: Record<string, unknown>
): ConfidenceResult {
  let score = 0;
  const factors: string[] = [];
  const salesforceIndicators: string[] = [];
  const ua = userAgent.toLowerCase();

  // ===== FALSE POSITIVE DETECTION =====
  for (const fpPattern of SALESFORCE_POSITIVE_INDICATORS.falsePositivePatterns) {
    if (ua.includes(fpPattern)) {
      return {
        confidence: 'low',
        score: 0,
        factors: [`False positive: ${fpPattern} detected`],
        salesforceIndicators: [],
        isFalsePositive: true,
        falsePositiveReason: `Bot/crawler detected: ${fpPattern}`
      };
    }
  }

  // Immediate callback (< 5s) is suspicious for stored XSS
  if (vulnType?.includes('xss') && delaySeconds < 5) {
    return {
      confidence: 'low',
      score: 0,
      factors: ['Immediate callback for stored XSS - likely self-trigger'],
      salesforceIndicators: [],
      isFalsePositive: true,
      falsePositiveReason: 'Self-triggered callback (delay < 5s for stored XSS)'
    };
  }

  // ===== DELAY SCORING (for stored vulnerabilities) =====
  if (delaySeconds > 3600) {
    score += 3;
    factors.push('Significant delay (>1hr) indicates stored execution');
  } else if (delaySeconds > 300) {
    score += 2;
    factors.push('Moderate delay (5-60min) suggests admin interaction');
  } else if (delaySeconds > 60) {
    score += 1;
    factors.push('Short delay (1-5min) possible legitimate trigger');
  }

  // ===== SALESFORCE-SPECIFIC INDICATORS =====
  // Check user agent for Salesforce markers
  for (const indicator of SALESFORCE_POSITIVE_INDICATORS.userAgents) {
    if (ua.includes(indicator)) {
      score += 2;
      salesforceIndicators.push(`UA contains: ${indicator}`);
    }
  }

  // Check for Salesforce IP ranges
  for (const ipPrefix of SALESFORCE_POSITIVE_INDICATORS.ipPatterns) {
    if (sourceIp.startsWith(ipPrefix)) {
      score += 2;
      salesforceIndicators.push(`Salesforce IP range: ${ipPrefix}`);
    }
  }

  // Check for Salesforce-specific headers
  for (const header of SALESFORCE_POSITIVE_INDICATORS.headers) {
    if (headers[header]) {
      score += 2;
      salesforceIndicators.push(`SF header: ${header}`);
    }
  }

  // ===== CALLBACK TYPE SCORING =====
  if (callbackType === 'dns') {
    score += 2;
    factors.push('DNS callback type (harder to spoof)');
  } else if (callbackType === 'http') {
    score += 1;
    factors.push('HTTP callback received');
  }

  // ===== USER AGENT QUALITY =====
  if (ua.includes('chrome/') || ua.includes('firefox/') || ua.includes('safari/')) {
    score += 1;
    factors.push('Real browser user agent');
  }

  // ===== INTERNAL IP SCORING =====
  if (sourceIp.startsWith('10.') || sourceIp.startsWith('192.168.') || sourceIp.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
    score += 2;
    factors.push('Internal IP (suggests admin/internal network)');
  }

  // ===== VULNERABILITY TYPE SPECIFIC SCORING =====
  if (vulnType === 'soql_injection' || vulnType === 'sharing_bypass' || vulnType === 'guest_user_abuse') {
    score += 1;
    factors.push(`High-impact vuln type: ${vulnType}`);
  }

  // ===== ADDITIONAL CONTEXT SCORING =====
  if (additionalContext?.sessionId) {
    score += 1;
    factors.push('Session ID captured');
  }
  if (additionalContext?.userId) {
    score += 1;
    factors.push('User ID captured');
  }
  if (additionalContext?.orgId) {
    score += 2;
    salesforceIndicators.push('Salesforce Org ID captured');
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low';
  if (score >= 7) {
    confidence = 'high';
  } else if (score >= 4) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    confidence,
    score,
    factors,
    salesforceIndicators,
    isFalsePositive: false
  };
}

function generateFindingTitle(vulnType: string, param: string): string {
  const titles: Record<string, string> = {
    'soql_injection': `SOQL Injection via ${param} parameter`,
    'sosl_injection': `SOSL Injection via ${param} parameter`,
    'apex_injection': `Apex Code Injection in ${param}`,
    'lightning_xss': `Stored XSS in Lightning Component (${param})`,
    'aura_component': `Exposed Aura Controller Action (${param})`,
    'lwc_security': `LWC Security Issue in ${param}`,
    'sharing_bypass': `Sharing Rule Bypass via ${param}`,
    'fls_bypass': `Field-Level Security Bypass (${param})`,
    'crud_bypass': `CRUD Permission Bypass in ${param}`,
    'open_redirect': `Open Redirect via ${param}`,
    'ssrf': `Server-Side Request Forgery (${param})`,
    'idor': `Insecure Direct Object Reference (${param})`,
    'csrf': `Cross-Site Request Forgery (${param})`,
    'guest_user_abuse': `Guest User Data Exposure (${param})`,
    'community_exposure': `Community/Experience Cloud Data Leak (${param})`,
  };

  return titles[vulnType] || `Security Issue in ${param}`;
}

function generateFindingDescription(vulnType: string, endpoint: string | undefined, delaySeconds: number): string {
  const ep = endpoint || 'unknown endpoint';
  const delay = delaySeconds > 60 ? `${Math.round(delaySeconds / 60)}m` : `${delaySeconds}s`;

  const descriptions: Record<string, string> = {
    'soql_injection': `Dynamic SOQL query construction at ${ep} allows injection of malicious query clauses. OOB callback received after ${delay}, confirming exploitation path. Attacker can extract sensitive Salesforce object data.`,
    'sosl_injection': `SOSL search query at ${ep} is vulnerable to injection. Callback received after ${delay}. May allow cross-object data extraction.`,
    'apex_injection': `Apex controller at ${ep} executes user-controlled code. Confirmed via ${delay} delayed callback. Critical risk of arbitrary code execution.`,
    'lightning_xss': `Lightning component renders unsanitized input at ${ep}. Stored XSS confirmed with ${delay} delay, indicating admin-level execution context.`,
    'aura_component': `Aura controller exposes sensitive action without proper authorization at ${ep}. Guest users may access restricted functionality.`,
    'sharing_bypass': `Record sharing rules bypassed at ${ep}. Confirmed ${delay} after injection. Users can access records outside their sharing scope.`,
    'fls_bypass': `Field-Level Security not enforced at ${ep}. Sensitive fields exposed to unauthorized users.`,
    'crud_bypass': `CRUD permissions not validated at ${ep}. Unauthorized create/read/update/delete operations possible.`,
    'guest_user_abuse': `Guest user context at ${ep} exposes sensitive data without authentication. Confirmed after ${delay}.`,
    'ssrf': `Server-side request to attacker-controlled endpoint from ${ep}. SSRF confirmed with ${delay} delay.`,
    'idor': `Direct object reference at ${ep} allows access to other users' records by manipulating ID parameter.`,
  };

  return descriptions[vulnType] || `Security vulnerability confirmed at ${ep} via OOB callback after ${delay} delay.`;
}
