import { supabase } from "@/integrations/supabase/client";

export interface Target {
  id: string;
  domain: string;
  status: string;
  cms_detected: string | null;
  tech_stack: string[];
  created_at: string;
  updated_at: string;
}

export interface Endpoint {
  id: string;
  target_id: string;
  endpoint: string;
  method: string;
  params: string[];
  auth_required: boolean;
  cms: string | null;
  risk_level: string;
  status: string;
  input_class: string | null;
  created_at: string;
}

export interface Injection {
  id: string;
  endpoint_id: string;
  token: string;
  param: string;
  context_type: string | null;
  status: string;
  injected_at: string | null;
  created_at: string;
}

export interface Callback {
  id: string;
  injection_id: string;
  callback_type: string;
  source_ip: string | null;
  user_agent: string | null;
  delay_seconds: number | null;
  confidence: string;
  raw_data: Record<string, unknown> | null;
  received_at: string;
}

export interface Finding {
  id: string;
  endpoint_id: string;
  callback_id: string | null;
  title: string;
  description: string | null;
  severity: string;
  evidence: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

export interface ScanLog {
  id: string;
  target_id: string | null;
  level: string;
  message: string;
  created_at: string;
}

export const scanTarget = async (domain: string) => {
  const { data, error } = await supabase.functions.invoke('scan-target', {
    body: { domain }
  });
  if (error) throw error;
  return data;
};

export const triggerCallback = async (token: string, callbackType = 'http') => {
  const { data, error } = await supabase.functions.invoke('oob-callback', {
    body: { token, callback_type: callbackType }
  });
  if (error) throw error;
  return data;
};

export const processInjections = async () => {
  const { data, error } = await supabase.functions.invoke('process-injections', {});
  if (error) throw error;
  return data;
};

export const getTargets = async () => {
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Target[];
};

export const getEndpoints = async () => {
  const { data, error } = await supabase
    .from('endpoints')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Endpoint[];
};

export const getCallbacks = async () => {
  const { data, error } = await supabase
    .from('callbacks')
    .select(`
      *,
      injections (
        *,
        endpoints (*)
      )
    `)
    .order('received_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getFindings = async () => {
  const { data, error } = await supabase
    .from('findings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Finding[];
};

export const getScanLogs = async (limit = 20) => {
  const { data, error } = await supabase
    .from('scan_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as ScanLog[];
};

export const getMetrics = async () => {
  const [targets, endpoints, injections, callbacks, findings] = await Promise.all([
    supabase.from('targets').select('id', { count: 'exact' }),
    supabase.from('endpoints').select('id, status, input_class', { count: 'exact' }),
    supabase.from('injections').select('id, status', { count: 'exact' }),
    supabase.from('callbacks').select('id', { count: 'exact' }),
    supabase.from('findings').select('id', { count: 'exact' })
  ]);

  const endpointsData = endpoints.data || [];
  const injectionsData = injections.data || [];

  return {
    totalTargets: targets.count || 0,
    totalEndpoints: endpoints.count || 0,
    activeInjections: injectionsData.filter(i => ['pending', 'injected'].includes(i.status)).length,
    totalCallbacks: callbacks.count || 0,
    confirmedFindings: findings.count || 0,
    highRiskInputs: endpointsData.filter(e => ['high', 'critical'].includes(e.status)).length,
    inputClassification: {
      display_content: endpointsData.filter(e => e.input_class === 'display_content').length,
      log_sink: endpointsData.filter(e => e.input_class === 'log_sink').length,
      admin_only: endpointsData.filter(e => e.input_class === 'admin_only').length,
      metadata: endpointsData.filter(e => e.input_class === 'metadata').length,
      api_field: endpointsData.filter(e => e.input_class === 'api_field').length,
    }
  };
};
