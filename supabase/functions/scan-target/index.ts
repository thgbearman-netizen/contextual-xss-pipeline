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
    const { domain } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create target
    const { data: target, error: targetError } = await supabase
      .from('targets')
      .insert({ domain, status: 'scanning' })
      .select()
      .single();

    if (targetError) throw targetError;

    console.log(`Starting scan for target: ${domain}`);

    // Log scan start
    await supabase.from('scan_logs').insert({
      target_id: target.id,
      level: 'info',
      message: `Starting surface discovery for ${domain}`
    });

    // Simulate discovering endpoints (in real implementation, this would use httpx, naabu, etc.)
    const discoveredEndpoints = generateEndpoints(domain);

    // Insert endpoints with classification
    for (const endpoint of discoveredEndpoints) {
      const { data: insertedEndpoint, error: endpointError } = await supabase
        .from('endpoints')
        .insert({
          target_id: target.id,
          ...endpoint
        })
        .select()
        .single();

      if (endpointError) {
        console.error('Error inserting endpoint:', endpointError);
        continue;
      }

      // Log discovery
      await supabase.from('scan_logs').insert({
        target_id: target.id,
        level: 'info',
        message: `Discovered endpoint: ${endpoint.method} ${endpoint.endpoint} [${endpoint.input_class}]`
      });

      // Generate injection token for high-risk endpoints
      if (['high', 'critical'].includes(endpoint.risk_level)) {
        const token = `xss_${crypto.randomUUID().slice(0, 6)}`;
        
        await supabase.from('injections').insert({
          endpoint_id: insertedEndpoint.id,
          token,
          param: endpoint.params[0] || 'body',
          context_type: inferContextType(endpoint.input_class),
          status: 'pending'
        });

        await supabase.from('scan_logs').insert({
          target_id: target.id,
          level: 'warn',
          message: `High-risk input detected: ${endpoint.endpoint} → token ${token}`
        });
      }
    }

    // Update target status
    await supabase
      .from('targets')
      .update({ status: 'complete', cms_detected: detectCMS(domain) })
      .eq('id', target.id);

    await supabase.from('scan_logs').insert({
      target_id: target.id,
      level: 'success',
      message: `Scan complete: ${discoveredEndpoints.length} endpoints discovered`
    });

    return new Response(
      JSON.stringify({ success: true, target_id: target.id, endpoints: discoveredEndpoints.length }),
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

function detectCMS(domain: string): string {
  // Simplified CMS detection logic
  if (domain.includes('wordpress') || domain.includes('wp')) return 'WordPress';
  if (domain.includes('drupal')) return 'Drupal';
  if (domain.includes('joomla')) return 'Joomla';
  return 'Custom';
}

function inferContextType(inputClass: string | null): string {
  switch (inputClass) {
    case 'display_content': return 'html_body';
    case 'log_sink': return 'log_viewer';
    case 'admin_only': return 'html_body';
    case 'api_field': return 'json';
    default: return 'html_body';
  }
}

function generateEndpoints(domain: string) {
  // Generate realistic endpoints based on common CMS patterns
  const endpoints = [
    {
      endpoint: '/wp-admin/admin-ajax.php',
      method: 'POST',
      params: ['action', 'content', 'title'],
      auth_required: true,
      cms: 'WordPress',
      risk_level: 'high',
      status: 'classified',
      input_class: 'admin_only'
    },
    {
      endpoint: '/api/v1/comments',
      method: 'POST',
      params: ['body', 'author', 'email'],
      auth_required: false,
      cms: 'Custom',
      risk_level: 'critical',
      status: 'classified',
      input_class: 'display_content'
    },
    {
      endpoint: '/contact/submit',
      method: 'POST',
      params: ['name', 'email', 'message'],
      auth_required: false,
      cms: 'Custom',
      risk_level: 'high',
      status: 'classified',
      input_class: 'display_content'
    },
    {
      endpoint: '/admin/logs/search',
      method: 'GET',
      params: ['query', 'filter'],
      auth_required: true,
      cms: 'Custom',
      risk_level: 'critical',
      status: 'classified',
      input_class: 'log_sink'
    },
    {
      endpoint: '/api/v2/users',
      method: 'POST',
      params: ['username', 'bio', 'avatar_url'],
      auth_required: true,
      cms: 'Custom',
      risk_level: 'medium',
      status: 'classified',
      input_class: 'api_field'
    },
    {
      endpoint: '/blog/post',
      method: 'POST',
      params: ['title', 'content', 'tags'],
      auth_required: true,
      cms: detectCMS(domain),
      risk_level: 'high',
      status: 'classified',
      input_class: 'display_content'
    },
    {
      endpoint: '/settings/profile',
      method: 'PUT',
      params: ['display_name', 'about'],
      auth_required: true,
      cms: 'Custom',
      risk_level: 'medium',
      status: 'classified',
      input_class: 'metadata'
    },
    {
      endpoint: '/newsletter/subscribe',
      method: 'POST',
      params: ['email', 'name'],
      auth_required: false,
      cms: 'Custom',
      risk_level: 'low',
      status: 'classified',
      input_class: 'api_field'
    }
  ];

  return endpoints;
}
