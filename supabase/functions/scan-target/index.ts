import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Salesforce-specific vulnerability categories
const SALESFORCE_VULN_CATEGORIES = {
  SOQL_INJECTION: 'soql_injection',
  SOSL_INJECTION: 'sosl_injection',
  APEX_INJECTION: 'apex_injection',
  LIGHTNING_XSS: 'lightning_xss',
  AURA_COMPONENT: 'aura_component',
  LWC_SECURITY: 'lwc_security',
  SHARING_BYPASS: 'sharing_bypass',
  FLS_BYPASS: 'fls_bypass',
  CRUD_BYPASS: 'crud_bypass',
  OPEN_REDIRECT: 'open_redirect',
  SSRF: 'ssrf',
  IDOR: 'idor',
  CSRF: 'csrf',
  API_EXPOSURE: 'api_exposure',
  GUEST_USER_ABUSE: 'guest_user_abuse',
  COMMUNITY_EXPOSURE: 'community_exposure',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, scanType = 'full', sessionId } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate a new session ID if not provided
    const activeSessionId = sessionId || crypto.randomUUID();

    // Detect if this is a Salesforce instance
    const salesforceInfo = detectSalesforceInstance(domain);

    // Create target with Salesforce metadata and session ID
    const { data: target, error: targetError } = await supabase
      .from('targets')
      .insert({ 
        domain, 
        status: 'scanning',
        cms_detected: salesforceInfo.type,
        tech_stack: salesforceInfo.techStack,
        session_id: activeSessionId
      })
      .select()
      .single();

    if (targetError) throw targetError;

    console.log(`Starting Salesforce security scan for: ${domain}`);

    // Log scan start with session ID
    await supabase.from('scan_logs').insert({
      target_id: target.id,
      session_id: activeSessionId,
      level: 'info',
      message: `🚀 Initiating Salesforce security assessment for ${domain}`
    });

    await supabase.from('scan_logs').insert({
      target_id: target.id,
      session_id: activeSessionId,
      level: 'info',
      message: `📋 Detected instance type: ${salesforceInfo.type} | Edition: ${salesforceInfo.edition}`
    });

    await supabase.from('scan_logs').insert({
      target_id: target.id,
      level: 'info',
      message: `📋 Detected instance type: ${salesforceInfo.type} | Edition: ${salesforceInfo.edition}`
    });

    // Discover Salesforce-specific endpoints
    const endpoints = await discoverSalesforceEndpoints(domain, salesforceInfo, scanType);

    // Insert endpoints and create injections for vulnerable ones
    for (const endpoint of endpoints) {
      // Extract only the fields that exist in the database table
      const { description, vuln_type, testable, ...dbEndpoint } = endpoint;
      
      const { data: insertedEndpoint, error: endpointError } = await supabase
        .from('endpoints')
        .insert({
          target_id: target.id,
          ...dbEndpoint
        })
        .select()
        .single();

      if (endpointError) {
        console.error('Error inserting endpoint:', endpointError);
        continue;
      }

      // Log discovery with context
      await supabase.from('scan_logs').insert({
        target_id: target.id,
        session_id: activeSessionId,
        level: endpoint.risk_level === 'critical' ? 'error' : endpoint.risk_level === 'high' ? 'warn' : 'info',
        message: `${getRiskEmoji(endpoint.risk_level)} ${endpoint.method} ${endpoint.endpoint} | ${endpoint.input_class} | Risk: ${endpoint.risk_level.toUpperCase()}`
      });

      // Generate injection tokens for testable endpoints
      if (endpoint.testable && ['high', 'critical'].includes(endpoint.risk_level)) {
        for (const param of endpoint.params.slice(0, 3)) {
          const token = generateSecureToken(endpoint.vuln_type);
          
          await supabase.from('injections').insert({
            endpoint_id: insertedEndpoint.id,
            token,
            param: param,
            context_type: endpoint.vuln_type,
            status: 'pending'
          });
        }

        await supabase.from('scan_logs').insert({
          target_id: target.id,
          session_id: activeSessionId,
          level: 'warn',
          message: `⚡ Created injection probes for ${endpoint.endpoint} targeting: ${endpoint.params.slice(0, 3).join(', ')}`
        });
      }
    }

    // Update target status
    await supabase
      .from('targets')
      .update({ 
        status: 'complete', 
        cms_detected: salesforceInfo.type,
        tech_stack: salesforceInfo.techStack
      })
      .eq('id', target.id);

    const criticalCount = endpoints.filter(e => e.risk_level === 'critical').length;
    const highCount = endpoints.filter(e => e.risk_level === 'high').length;

    await supabase.from('scan_logs').insert({
      target_id: target.id,
      session_id: activeSessionId,
      level: criticalCount > 0 ? 'error' : highCount > 0 ? 'warn' : 'success',
      message: `✅ Scan complete: ${endpoints.length} endpoints | ${criticalCount} critical | ${highCount} high risk`
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        target_id: target.id, 
        session_id: activeSessionId,
        endpoints: endpoints.length,
        critical: criticalCount,
        high: highCount,
        salesforce_type: salesforceInfo.type
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scan error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getRiskEmoji(risk: string): string {
  switch (risk) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

function generateSecureToken(vulnType: string): string {
  const prefix = vulnType.substring(0, 4).toUpperCase();
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  return `${prefix}_${uuid}`;
}

function detectSalesforceInstance(domain: string): {
  type: string;
  edition: string;
  techStack: string[];
  isSandbox: boolean;
  isLightning: boolean;
} {
  const lowerDomain = domain.toLowerCase();
  
  let type = 'Salesforce';
  let edition = 'Enterprise';
  let isSandbox = false;
  let isLightning = true;
  const techStack: string[] = ['Salesforce Platform'];

  // Detect instance type
  if (lowerDomain.includes('.sandbox.') || lowerDomain.includes('--') || lowerDomain.includes('.cs')) {
    isSandbox = true;
    techStack.push('Sandbox Environment');
  }

  if (lowerDomain.includes('force.com')) {
    type = 'Salesforce Classic/Lightning';
    techStack.push('Force.com Platform');
  }

  if (lowerDomain.includes('salesforce.com')) {
    type = 'Salesforce Core';
    techStack.push('Salesforce CRM');
  }

  if (lowerDomain.includes('site.com') || lowerDomain.includes('siteforce')) {
    type = 'Salesforce Sites';
    techStack.push('Site.com', 'Guest User Access');
  }

  if (lowerDomain.includes('my.salesforce.com')) {
    type = 'My Domain (Lightning)';
    techStack.push('Lightning Experience', 'Aura Components');
    isLightning = true;
  }

  if (lowerDomain.includes('community') || lowerDomain.includes('experience')) {
    type = 'Experience Cloud (Community)';
    techStack.push('Experience Cloud', 'Guest User Portal', 'LWC');
    edition = 'Experience Cloud';
  }

  if (lowerDomain.includes('visualforce')) {
    techStack.push('Visualforce Pages');
    isLightning = false;
  }

  // Add common components
  techStack.push('Apex Controllers', 'REST API', 'SOQL/SOSL');

  return { type, edition, techStack, isSandbox, isLightning };
}

interface SalesforceEndpoint {
  endpoint: string;
  method: string;
  params: string[];
  auth_required: boolean;
  cms: string;
  risk_level: string;
  status: string;
  input_class: string;
  vuln_type: string;
  testable: boolean;
  description?: string;
}

async function discoverSalesforceEndpoints(
  domain: string, 
  salesforceInfo: ReturnType<typeof detectSalesforceInstance>,
  scanType: string
): Promise<SalesforceEndpoint[]> {
  const endpoints: SalesforceEndpoint[] = [];

  // ===== SOQL INJECTION VECTORS =====
  endpoints.push({
    endpoint: '/services/data/v59.0/query',
    method: 'GET',
    params: ['q'],
    auth_required: true,
    cms: 'Salesforce REST API',
    risk_level: 'critical',
    status: 'discovered',
    input_class: 'soql_query',
    vuln_type: SALESFORCE_VULN_CATEGORIES.SOQL_INJECTION,
    testable: true,
    description: 'SOQL Query API - Test for injection in WHERE clauses'
  });

  endpoints.push({
    endpoint: '/services/apexrest/CustomSearch',
    method: 'POST',
    params: ['searchTerm', 'objectType', 'filterField', 'filterValue'],
    auth_required: true,
    cms: 'Custom Apex REST',
    risk_level: 'critical',
    status: 'discovered',
    input_class: 'apex_controller',
    vuln_type: SALESFORCE_VULN_CATEGORIES.SOQL_INJECTION,
    testable: true,
    description: 'Custom Apex endpoint with dynamic SOQL construction'
  });

  // ===== SOSL INJECTION VECTORS =====
  endpoints.push({
    endpoint: '/services/data/v59.0/search',
    method: 'GET',
    params: ['q'],
    auth_required: true,
    cms: 'Salesforce REST API',
    risk_level: 'high',
    status: 'discovered',
    input_class: 'sosl_query',
    vuln_type: SALESFORCE_VULN_CATEGORIES.SOSL_INJECTION,
    testable: true,
    description: 'SOSL Search API - Test for injection in FIND clauses'
  });

  // ===== AURA/LIGHTNING COMPONENT VECTORS =====
  endpoints.push({
    endpoint: '/aura',
    method: 'POST',
    params: ['message', 'aura.context', 'aura.token'],
    auth_required: false,
    cms: 'Lightning Aura',
    risk_level: 'critical',
    status: 'discovered',
    input_class: 'aura_action',
    vuln_type: SALESFORCE_VULN_CATEGORIES.AURA_COMPONENT,
    testable: true,
    description: 'Aura framework endpoint - Test for exposed controller actions'
  });

  endpoints.push({
    endpoint: '/s/sfsites/aura',
    method: 'POST',
    params: ['message', 'aura.context', 'aura.token'],
    auth_required: false,
    cms: 'Lightning Sites',
    risk_level: 'critical',
    status: 'discovered',
    input_class: 'guest_aura',
    vuln_type: SALESFORCE_VULN_CATEGORIES.GUEST_USER_ABUSE,
    testable: true,
    description: 'Guest user Aura endpoint - Test for unauthenticated access'
  });

  // ===== SHARING/FLS BYPASS VECTORS =====
  endpoints.push({
    endpoint: '/services/apexrest/RecordAccess',
    method: 'GET',
    params: ['recordId', 'objectName'],
    auth_required: true,
    cms: 'Custom Apex REST',
    risk_level: 'high',
    status: 'discovered',
    input_class: 'record_access',
    vuln_type: SALESFORCE_VULN_CATEGORIES.SHARING_BYPASS,
    testable: true,
    description: 'Custom record access - Test for sharing rule bypass'
  });

  endpoints.push({
    endpoint: '/services/apexrest/BulkExport',
    method: 'POST',
    params: ['objectType', 'fields', 'whereClause'],
    auth_required: true,
    cms: 'Custom Apex REST',
    risk_level: 'critical',
    status: 'discovered',
    input_class: 'bulk_data',
    vuln_type: SALESFORCE_VULN_CATEGORIES.FLS_BYPASS,
    testable: true,
    description: 'Bulk export endpoint - Test for FLS enforcement'
  });

  // ===== IDOR VECTORS =====
  endpoints.push({
    endpoint: '/services/data/v59.0/sobjects/Account/{id}',
    method: 'GET',
    params: ['id'],
    auth_required: true,
    cms: 'Salesforce REST API',
    risk_level: 'high',
    status: 'discovered',
    input_class: 'object_access',
    vuln_type: SALESFORCE_VULN_CATEGORIES.IDOR,
    testable: true,
    description: 'Direct object access - Test IDOR via record ID manipulation'
  });

  endpoints.push({
    endpoint: '/services/apexrest/GetDocument',
    method: 'GET',
    params: ['documentId', 'attachmentId'],
    auth_required: true,
    cms: 'Custom Apex REST',
    risk_level: 'high',
    status: 'discovered',
    input_class: 'file_access',
    vuln_type: SALESFORCE_VULN_CATEGORIES.IDOR,
    testable: true,
    description: 'Document retrieval - Test for insecure direct object reference'
  });

  // ===== OPEN REDIRECT VECTORS =====
  endpoints.push({
    endpoint: '/secur/logout.jsp',
    method: 'GET',
    params: ['retURL', 'startURL'],
    auth_required: false,
    cms: 'Salesforce Core',
    risk_level: 'medium',
    status: 'discovered',
    input_class: 'redirect',
    vuln_type: SALESFORCE_VULN_CATEGORIES.OPEN_REDIRECT,
    testable: true,
    description: 'Logout redirect - Test for open redirect vulnerabilities'
  });

  endpoints.push({
    endpoint: '/servlet/servlet.su',
    method: 'GET',
    params: ['oid', 'retURL', 'suorgadminid'],
    auth_required: true,
    cms: 'Salesforce Core',
    risk_level: 'high',
    status: 'discovered',
    input_class: 'switch_user',
    vuln_type: SALESFORCE_VULN_CATEGORIES.OPEN_REDIRECT,
    testable: true,
    description: 'User switch servlet - Test for URL manipulation'
  });

  // ===== XSS IN LIGHTNING VECTORS =====
  endpoints.push({
    endpoint: '/apex/CustomVisualforcePage',
    method: 'GET',
    params: ['param1', 'param2', 'id'],
    auth_required: false,
    cms: 'Visualforce',
    risk_level: 'high',
    status: 'discovered',
    input_class: 'visualforce',
    vuln_type: SALESFORCE_VULN_CATEGORIES.LIGHTNING_XSS,
    testable: true,
    description: 'Visualforce page - Test for reflected XSS in page parameters'
  });

  endpoints.push({
    endpoint: '/lightning/cmp/c:CustomComponent',
    method: 'POST',
    params: ['attributes', 'state'],
    auth_required: true,
    cms: 'Lightning Components',
    risk_level: 'high',
    status: 'discovered',
    input_class: 'lwc_component',
    vuln_type: SALESFORCE_VULN_CATEGORIES.LWC_SECURITY,
    testable: true,
    description: 'LWC component - Test for DOM-based XSS'
  });

  // ===== COMMUNITY/EXPERIENCE CLOUD VECTORS =====
  if (salesforceInfo.type.includes('Experience') || salesforceInfo.type.includes('Community')) {
    endpoints.push({
      endpoint: '/s/login',
      method: 'POST',
      params: ['username', 'password', 'startURL'],
      auth_required: false,
      cms: 'Experience Cloud',
      risk_level: 'medium',
      status: 'discovered',
      input_class: 'community_auth',
      vuln_type: SALESFORCE_VULN_CATEGORIES.COMMUNITY_EXPOSURE,
      testable: false,
      description: 'Community login - Test for authentication bypass'
    });

    endpoints.push({
      endpoint: '/s/sfsites/l/',
      method: 'GET',
      params: ['startURL', 'locale'],
      auth_required: false,
      cms: 'Experience Cloud',
      risk_level: 'critical',
      status: 'discovered',
      input_class: 'guest_user',
      vuln_type: SALESFORCE_VULN_CATEGORIES.GUEST_USER_ABUSE,
      testable: true,
      description: 'Guest user landing - Test for data exposure to unauthenticated users'
    });
  }

  // ===== SSRF VECTORS =====
  endpoints.push({
    endpoint: '/services/apexrest/ProxyRequest',
    method: 'POST',
    params: ['targetUrl', 'method', 'headers', 'body'],
    auth_required: true,
    cms: 'Custom Apex REST',
    risk_level: 'critical',
    status: 'discovered',
    input_class: 'ssrf_endpoint',
    vuln_type: SALESFORCE_VULN_CATEGORIES.SSRF,
    testable: true,
    description: 'HTTP callout proxy - Test for SSRF via URL parameter'
  });

  // ===== API EXPOSURE VECTORS =====
  endpoints.push({
    endpoint: '/services/data/v59.0/sobjects',
    method: 'GET',
    params: [],
    auth_required: true,
    cms: 'Salesforce REST API',
    risk_level: 'medium',
    status: 'discovered',
    input_class: 'api_discovery',
    vuln_type: SALESFORCE_VULN_CATEGORIES.API_EXPOSURE,
    testable: false,
    description: 'SObject describe - Enumerate accessible objects'
  });

  endpoints.push({
    endpoint: '/services/data/v59.0/limits',
    method: 'GET',
    params: [],
    auth_required: true,
    cms: 'Salesforce REST API',
    risk_level: 'low',
    status: 'discovered',
    input_class: 'api_limits',
    vuln_type: SALESFORCE_VULN_CATEGORIES.API_EXPOSURE,
    testable: false,
    description: 'API limits endpoint - Information disclosure'
  });

  // ===== CRUD BYPASS VECTORS =====
  endpoints.push({
    endpoint: '/services/data/v59.0/sobjects/User/{id}',
    method: 'PATCH',
    params: ['ProfileId', 'UserRoleId', 'IsActive'],
    auth_required: true,
    cms: 'Salesforce REST API',
    risk_level: 'critical',
    status: 'discovered',
    input_class: 'user_modification',
    vuln_type: SALESFORCE_VULN_CATEGORIES.CRUD_BYPASS,
    testable: true,
    description: 'User object update - Test for privilege escalation'
  });

  endpoints.push({
    endpoint: '/services/apexrest/AdminAction',
    method: 'POST',
    params: ['action', 'targetUserId', 'permissions'],
    auth_required: true,
    cms: 'Custom Apex REST',
    risk_level: 'critical',
    status: 'discovered',
    input_class: 'admin_function',
    vuln_type: SALESFORCE_VULN_CATEGORIES.CRUD_BYPASS,
    testable: true,
    description: 'Admin action endpoint - Test for authorization bypass'
  });

  return endpoints;
}
