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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending injections
    const { data: pendingInjections, error: injectionsError } = await supabase
      .from('injections')
      .select('*, endpoints(*)')
      .eq('status', 'pending')
      .limit(10);

    if (injectionsError) throw injectionsError;

    console.log(`Processing ${pendingInjections?.length || 0} pending injections`);

    for (const injection of pendingInjections || []) {
      // Update injection status to injected
      await supabase
        .from('injections')
        .update({ 
          status: 'injected',
          injected_at: new Date().toISOString()
        })
        .eq('id', injection.id);

      // Update endpoint status
      await supabase
        .from('endpoints')
        .update({ status: 'testing' })
        .eq('id', injection.endpoint_id);

      // Log the injection
      const endpoint = injection.endpoints;
      if (endpoint?.target_id) {
        await supabase.from('scan_logs').insert({
          target_id: endpoint.target_id,
          level: 'info',
          message: `Injecting ${injection.context_type} probe into ${endpoint.endpoint} [${injection.param}]`
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: pendingInjections?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Injection error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
