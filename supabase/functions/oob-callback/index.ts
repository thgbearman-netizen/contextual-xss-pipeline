import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, callback_type, source_ip, user_agent } = await req.json();

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
      .single();

    if (injectionError || !injection) {
      console.log('No injection found for token:', token);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate delay
    const injectedAt = injection.injected_at || injection.created_at;
    const delaySeconds = Math.floor((Date.now() - new Date(injectedAt).getTime()) / 1000);

    // Determine confidence based on signals
    const confidence = calculateConfidence(user_agent, source_ip, delaySeconds);

    // Create callback record
    const { data: callback, error: callbackError } = await supabase
      .from('callbacks')
      .insert({
        injection_id: injection.id,
        callback_type: callback_type || 'http',
        source_ip: source_ip || req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: user_agent || req.headers.get('user-agent') || 'unknown',
        delay_seconds: delaySeconds,
        confidence,
        raw_data: { token, headers: Object.fromEntries(req.headers) }
      })
      .select()
      .single();

    if (callbackError) throw callbackError;

    // Update injection status
    await supabase
      .from('injections')
      .update({ status: 'callback_received' })
      .eq('id', injection.id);

    // Update endpoint status if high confidence
    if (confidence === 'high') {
      await supabase
        .from('endpoints')
        .update({ status: 'vulnerable' })
        .eq('id', injection.endpoint_id);

      // Create finding
      await supabase.from('findings').insert({
        endpoint_id: injection.endpoint_id,
        callback_id: callback.id,
        title: `Blind XSS in ${injection.param} parameter`,
        description: `OOB callback received with ${delaySeconds}s delay, indicating stored XSS execution in admin context`,
        severity: 'high',
        evidence: {
          token,
          delay: `${delaySeconds}s`,
          user_agent,
          source_ip,
          confidence
        }
      });
    }

    // Log the callback
    const targetId = injection.endpoints?.targets?.id;
    if (targetId) {
      await supabase.from('scan_logs').insert({
        target_id: targetId,
        level: confidence === 'high' ? 'success' : 'warn',
        message: `Callback received: ${token} → ${confidence} confidence (delay: ${delaySeconds}s)`
      });
    }

    return new Response(
      JSON.stringify({ success: true, callback_id: callback.id, confidence }),
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

function calculateConfidence(userAgent: string, sourceIp: string, delaySeconds: number): string {
  let score = 0;

  // Delay scoring (stored XSS typically has delay)
  if (delaySeconds > 3600) score += 3; // > 1 hour
  else if (delaySeconds > 300) score += 2; // > 5 minutes
  else if (delaySeconds > 30) score += 1; // > 30 seconds

  // User agent scoring
  if (userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('admin') || ua.includes('panel')) score += 2;
    if (ua.includes('chrome') || ua.includes('firefox')) score += 1;
    if (ua.includes('scanner') || ua.includes('bot')) score -= 2;
  }

  // IP scoring (internal IPs suggest admin access)
  if (sourceIp) {
    if (sourceIp.startsWith('10.') || sourceIp.startsWith('192.168.') || sourceIp.startsWith('172.')) {
      score += 2;
    }
  }

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}
