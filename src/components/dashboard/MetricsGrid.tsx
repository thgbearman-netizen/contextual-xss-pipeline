import { MetricCard } from "@/components/ui/MetricCard";
import {
  Globe,
  Fingerprint,
  Zap,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import type { ScanMetrics } from "@/hooks/useScanData";

interface MetricsGridProps {
  metrics: ScanMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard
        title="Targets Scanned"
        value={metrics.totalTargets.toLocaleString()}
        subtitle="Salesforce instances"
        icon={Globe}
        variant="primary"
      />
      <MetricCard
        title="Endpoints Found"
        value={metrics.totalEndpoints.toLocaleString()}
        subtitle={`Vulnerable: ${metrics.vulnerableEndpoints}`}
        icon={Fingerprint}
      />
      <MetricCard
        title="Active Injections"
        value={metrics.activeInjections.toLocaleString()}
        subtitle="Awaiting callback"
        icon={Zap}
        variant="warning"
      />
      <MetricCard
        title="Callbacks"
        value={metrics.totalCallbacks.toLocaleString()}
        subtitle={`High conf: ${metrics.highConfidenceCallbacks}`}
        icon={AlertTriangle}
        variant={metrics.highConfidenceCallbacks > 0 ? "destructive" : "default"}
      />
      <MetricCard
        title="Confirmed Vulns"
        value={metrics.confirmedFindings.toLocaleString()}
        subtitle={`Critical: ${metrics.criticalFindings}`}
        icon={CheckCircle}
        variant={metrics.confirmedFindings > 0 ? "success" : "default"}
      />
      <MetricCard
        title="Critical/High"
        value={(metrics.criticalFindings + metrics.highFindings).toLocaleString()}
        subtitle="Priority findings"
        icon={ShieldAlert}
        variant={metrics.criticalFindings > 0 ? "destructive" : "default"}
      />
    </div>
  );
}
