import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  getTargets, 
  getEndpoints, 
  getCallbacks, 
  getScanLogs, 
  getMetrics,
  scanTarget,
  processInjections,
  type Target,
  type Endpoint,
  type ScanLog
} from "@/lib/api";

export function useScanData() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [metrics, setMetrics] = useState({
    totalTargets: 0,
    totalEndpoints: 0,
    activeInjections: 0,
    totalCallbacks: 0,
    confirmedFindings: 0,
    highRiskInputs: 0,
    inputClassification: {
      display_content: 0,
      log_sink: 0,
      admin_only: 0,
      metadata: 0,
      api_field: 0,
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [targetsData, endpointsData, callbacksData, logsData, metricsData] = await Promise.all([
        getTargets(),
        getEndpoints(),
        getCallbacks(),
        getScanLogs(),
        getMetrics()
      ]);

      setTargets(targetsData);
      setEndpoints(endpointsData);
      setCallbacks(callbacksData);
      setLogs(logsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startScan = useCallback(async (domain: string) => {
    setIsScanning(true);
    try {
      await scanTarget(domain);
      // Process pending injections after scan
      await processInjections();
      await fetchData();
    } catch (error) {
      console.error('Scan error:', error);
      throw error;
    } finally {
      setIsScanning(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
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

    const logsChannel = supabase
      .channel('logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_logs' }, (payload) => {
        setLogs(prev => [payload.new as ScanLog, ...prev.slice(0, 19)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(endpointsChannel);
      supabase.removeChannel(callbacksChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [fetchData]);

  return {
    targets,
    endpoints,
    callbacks,
    logs,
    metrics,
    isLoading,
    isScanning,
    startScan,
    refresh: fetchData
  };
}
