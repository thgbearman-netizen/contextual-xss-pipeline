import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useScanSession } from "./useScanSession";
import { 
  getTargets, 
  getEndpoints, 
  getCallbacks, 
  getFindings,
  getScanLogs, 
  getMetrics,
  getInjections,
  scanTarget,
  processInjections,
  triggerCallback,
  type Target,
  type Endpoint,
  type Callback,
  type Finding,
  type ScanLog
} from "@/lib/api";

export interface ScanMetrics {
  totalTargets: number;
  totalEndpoints: number;
  activeInjections: number;
  totalCallbacks: number;
  highConfidenceCallbacks: number;
  confirmedFindings: number;
  criticalFindings: number;
  highFindings: number;
  vulnerableEndpoints: number;
  vulnTypeCount: Record<string, number>;
  severityCount: Record<string, number>;
  confidenceCount: Record<string, number>;
  inputClassification: Record<string, number>;
}

const defaultMetrics: ScanMetrics = {
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

export function useScanData() {
  const { sessionId, startNewSession, hasActiveSession } = useScanSession();
  
  const [targets, setTargets] = useState<Target[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [injections, setInjections] = useState<any[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [metrics, setMetrics] = useState<ScanMetrics>(defaultMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Clear all UI state for fresh session
  const clearSessionData = useCallback(() => {
    setTargets([]);
    setEndpoints([]);
    setCallbacks([]);
    setFindings([]);
    setInjections([]);
    setLogs([]);
    setMetrics(defaultMetrics);
  }, []);

  const fetchData = useCallback(async (activeSessionId?: string) => {
    const sid = activeSessionId || sessionId;
    
    // If no session, show empty state
    if (!sid) {
      clearSessionData();
      setIsLoading(false);
      return;
    }

    try {
      setLastError(null);
      const [
        targetsData, 
        endpointsData, 
        callbacksData, 
        findingsData,
        injectionsData,
        logsData, 
        metricsData
      ] = await Promise.all([
        getTargets(sid),
        getEndpoints(undefined, sid),
        getCallbacks(),
        getFindings(),
        getInjections(),
        getScanLogs(50, undefined, sid),
        getMetrics(sid)
      ]);

      // Filter callbacks and findings to only show ones related to this session's endpoints
      const sessionEndpointIds = new Set(endpointsData.map(e => e.id));
      const filteredCallbacks = callbacksData.filter(c => {
        // Check if callback's injection belongs to a session endpoint
        const injectionEndpointId = injectionsData.find(i => i.id === c.injection_id)?.endpoint_id;
        return injectionEndpointId && sessionEndpointIds.has(injectionEndpointId);
      });
      const filteredFindings = findingsData.filter(f => sessionEndpointIds.has(f.endpoint_id));
      const filteredInjections = injectionsData.filter(i => sessionEndpointIds.has(i.endpoint_id));

      setTargets(targetsData);
      setEndpoints(endpointsData);
      setCallbacks(filteredCallbacks);
      setFindings(filteredFindings);
      setInjections(filteredInjections);
      setLogs(logsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLastError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, clearSessionData]);

  const startScan = useCallback(async (domain: string, scanType = 'full') => {
    setIsScanning(true);
    setLastError(null);
    
    // Clear previous session data and start new session
    clearSessionData();
    const newSession = startNewSession(domain);
    
    try {
      const result = await scanTarget(domain, scanType, newSession.id);
      // Process pending injections after scan
      await processInjections();
      await fetchData(newSession.id);
      return result;
    } catch (error) {
      console.error('Scan error:', error);
      setLastError(error instanceof Error ? error.message : 'Scan failed');
      throw error;
    } finally {
      setIsScanning(false);
    }
  }, [clearSessionData, startNewSession, fetchData]);

  const simulateCallback = useCallback(async (token: string, callbackType = 'http') => {
    try {
      setLastError(null);
      const result = await triggerCallback(token, callbackType, {
        sessionId: 'test_session_' + Date.now(),
        userId: '005000000000001',
        orgId: '00D000000000001'
      });
      await fetchData();
      return result;
    } catch (error) {
      console.error('Callback simulation error:', error);
      setLastError(error instanceof Error ? error.message : 'Callback simulation failed');
      throw error;
    }
  }, [fetchData]);

  const runInjections = useCallback(async (batchSize = 20, vulnTypeFilter?: string) => {
    try {
      setLastError(null);
      const result = await processInjections(batchSize, vulnTypeFilter);
      await fetchData();
      return result;
    } catch (error) {
      console.error('Injection processing error:', error);
      setLastError(error instanceof Error ? error.message : 'Injection processing failed');
      throw error;
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates - filter by session in the handler
    const endpointsChannel = supabase
      .channel('endpoints-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'endpoints' }, () => {
        fetchData();
      })
      .subscribe();

    const callbacksChannel = supabase
      .channel('callbacks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'callbacks' }, () => {
        fetchData();
      })
      .subscribe();

    const findingsChannel = supabase
      .channel('findings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'findings' }, () => {
        fetchData();
      })
      .subscribe();

    const logsChannel = supabase
      .channel('logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_logs' }, (payload) => {
        const newLog = payload.new as ScanLog & { session_id?: string };
        // Only add log if it belongs to current session
        if (!sessionId || newLog.session_id === sessionId) {
          setLogs(prev => [newLog, ...prev.slice(0, 49)]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(endpointsChannel);
      supabase.removeChannel(callbacksChannel);
      supabase.removeChannel(findingsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [fetchData, sessionId]);

  return {
    targets,
    endpoints,
    callbacks,
    findings,
    injections,
    logs,
    metrics,
    isLoading,
    isScanning,
    lastError,
    sessionId,
    hasActiveSession,
    startScan,
    simulateCallback,
    runInjections,
    refresh: fetchData,
    clearSession: clearSessionData
  };
}
