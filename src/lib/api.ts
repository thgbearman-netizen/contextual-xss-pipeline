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
  injections?: {
    token: string;
    param: string;
    context_type: string | null;
    endpoints?: {
      endpoint: string;
      method: string;
    };
  };
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

// Salesforce vulnerability categories
export const SALESFORCE_VULN_CATEGORIES = {
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
} as const;

export const VULN_CATEGORY_LABELS: Record<string, string> = {
  soql_injection: 'SOQL Injection',
  sosl_injection: 'SOSL Injection',
  apex_injection: 'Apex Injection',
  lightning_xss: 'Lightning XSS',
  aura_component: 'Aura Component',
  lwc_security: 'LWC Security',
  sharing_bypass: 'Sharing Bypass',
  fls_bypass: 'FLS Bypass',
  crud_bypass: 'CRUD Bypass',
  open_redirect: 'Open Redirect',
  ssrf: 'SSRF',
  idor: 'IDOR',
  csrf: 'CSRF',
  api_exposure: 'API Exposure',
  guest_user_abuse: 'Guest User Abuse',
  community_exposure: 'Community Exposure',
};

export const scanTarget = async (domain: string, scanType = 'full', sessionId?: string) => {
  const { data, error } = await supabase.functions.invoke('scan-target', {
    body: { domain, scanType, sessionId }
  });
  if (error) throw error;
  return data;
};

export const triggerCallback = async (
  token: string, 
  callbackType = 'http',
  additionalContext?: Record<string, unknown>
) => {
  const { data, error } = await supabase.functions.invoke('oob-callback', {
    body: { 
      token, 
      callback_type: callbackType,
      additional_context: additionalContext
    }
  });
  if (error) throw error;
  return data;
};

export const processInjections = async (batchSize = 20, vulnTypeFilter?: string) => {
  const { data, error } = await supabase.functions.invoke('process-injections', {
    body: { batchSize, vulnTypeFilter }
  });
  if (error) throw error;
  return data;
};

export const getTargets = async (sessionId?: string) => {
  let query = supabase
    .from('targets')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Target[];
};

export const getEndpoints = async (targetId?: string, sessionId?: string) => {
  let query = supabase
    .from('endpoints')
    .select('*, targets!inner(session_id)')
    .order('risk_level', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (targetId) {
    query = query.eq('target_id', targetId);
  }
  
  if (sessionId) {
    query = query.eq('targets.session_id', sessionId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Endpoint[];
};

export const getInjections = async (status?: string) => {
  let query = supabase
    .from('injections')
    .select(`
      *,
      endpoints (
        endpoint,
        method,
        input_class
      )
    `)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getCallbacks = async () => {
  const { data, error } = await supabase
    .from('callbacks')
    .select(`
      *,
      injections (
        token,
        param,
        context_type,
        endpoints (
          endpoint,
          method
        )
      )
    `)
    .order('received_at', { ascending: false });
  if (error) throw error;
  return data as Callback[];
};

export const getFindings = async (severity?: string) => {
  let query = supabase
    .from('findings')
    .select(`
      *,
      endpoints (
        endpoint,
        method,
        input_class
      )
    `)
    .order('created_at', { ascending: false });
  
  if (severity) {
    query = query.eq('severity', severity);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Finding[];
};

export const getScanLogs = async (limit = 50, targetId?: string, sessionId?: string) => {
  let query = supabase
    .from('scan_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (targetId) {
    query = query.eq('target_id', targetId);
  }
  
  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as ScanLog[];
};

export const getMetrics = async (sessionId?: string) => {
  // If sessionId provided, get target IDs for this session first
  let targetIds: string[] = [];
  if (sessionId) {
    const { data: sessionTargets } = await supabase
      .from('targets')
      .select('id')
      .eq('session_id', sessionId);
    targetIds = sessionTargets?.map(t => t.id) || [];
    
    // If no targets in this session, return empty metrics
    if (targetIds.length === 0) {
      return {
        totalTargets: 0,
        totalEndpoints: 0,
        activeInjections: 0,
        totalCallbacks: 0,
        highConfidenceCallbacks: 0,
        confirmedFindings: 0,
        criticalFindings: 0,
        highFindings: 0,
        vulnerableEndpoints: 0,
        vulnTypeCount: {},
        severityCount: { critical: 0, high: 0, medium: 0, low: 0 },
        confidenceCount: { high: 0, medium: 0, low: 0 },
        inputClassification: {}
      };
    }
  }

  // Build queries with optional session filtering
  let targetsQuery = supabase.from('targets').select('id', { count: 'exact' });
  let endpointsQuery = supabase.from('endpoints').select('id, status, input_class, risk_level', { count: 'exact' });
  let injectionsQuery = supabase.from('injections').select('id, status, context_type', { count: 'exact' });
  let callbacksQuery = supabase.from('callbacks').select('id, confidence, is_duplicate', { count: 'exact' });
  let findingsQuery = supabase.from('findings').select('id, severity', { count: 'exact' });

  if (sessionId && targetIds.length > 0) {
    targetsQuery = targetsQuery.eq('session_id', sessionId);
    endpointsQuery = endpointsQuery.in('target_id', targetIds);
  }

  const [targets, endpoints, injections, callbacks, findings] = await Promise.all([
    targetsQuery,
    endpointsQuery,
    injectionsQuery,
    callbacksQuery,
    findingsQuery
  ]);

  let endpointsData = endpoints.data || [];
  let injectionsData = injections.data || [];
  let callbacksData = (callbacks.data || []).filter((c: any) => !c.is_duplicate); // Exclude duplicates
  let findingsData = findings.data || [];

  // Filter injections and findings by session's endpoints
  if (sessionId && targetIds.length > 0) {
    const endpointIds = endpointsData.map(e => e.id);
    injectionsData = injectionsData.filter((i: any) => endpointIds.includes(i.endpoint_id));
    findingsData = findingsData.filter((f: any) => endpointIds.includes(f.endpoint_id));
  }

  // Count vulnerabilities by type
  const vulnTypeCount: Record<string, number> = {};
  injectionsData.forEach(i => {
    const type = i.context_type || 'unknown';
    vulnTypeCount[type] = (vulnTypeCount[type] || 0) + 1;
  });

  // Count findings by severity
  const severityCount: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  findingsData.forEach(f => {
    if (severityCount[f.severity] !== undefined) {
      severityCount[f.severity]++;
    }
  });

  // Count callbacks by confidence
  const confidenceCount: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0
  };
  callbacksData.forEach(c => {
    if (confidenceCount[c.confidence] !== undefined) {
      confidenceCount[c.confidence]++;
    }
  });

  return {
    totalTargets: targets.count || 0,
    totalEndpoints: endpoints.count || 0,
    activeInjections: injectionsData.filter(i => ['pending', 'injected'].includes(i.status)).length,
    totalCallbacks: callbacks.count || 0,
    highConfidenceCallbacks: confidenceCount.high,
    confirmedFindings: findings.count || 0,
    criticalFindings: severityCount.critical,
    highFindings: severityCount.high,
    vulnerableEndpoints: endpointsData.filter(e => e.status === 'vulnerable').length,
    vulnTypeCount,
    severityCount,
    confidenceCount,
    inputClassification: {
      soql_query: endpointsData.filter(e => e.input_class === 'soql_query').length,
      sosl_query: endpointsData.filter(e => e.input_class === 'sosl_query').length,
      apex_controller: endpointsData.filter(e => e.input_class === 'apex_controller').length,
      aura_action: endpointsData.filter(e => e.input_class === 'aura_action').length,
      guest_aura: endpointsData.filter(e => e.input_class === 'guest_aura').length,
      visualforce: endpointsData.filter(e => e.input_class === 'visualforce').length,
      lwc_component: endpointsData.filter(e => e.input_class === 'lwc_component').length,
      record_access: endpointsData.filter(e => e.input_class === 'record_access').length,
      bulk_data: endpointsData.filter(e => e.input_class === 'bulk_data').length,
      object_access: endpointsData.filter(e => e.input_class === 'object_access').length,
      redirect: endpointsData.filter(e => e.input_class === 'redirect').length,
      ssrf_endpoint: endpointsData.filter(e => e.input_class === 'ssrf_endpoint').length,
      api_discovery: endpointsData.filter(e => e.input_class === 'api_discovery').length,
      community_auth: endpointsData.filter(e => e.input_class === 'community_auth').length,
      guest_user: endpointsData.filter(e => e.input_class === 'guest_user').length,
    }
  };
};

// Utility to delete all test data (for development)
export const clearAllData = async () => {
  await supabase.from('findings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('callbacks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('injections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('scan_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('endpoints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('targets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
};
