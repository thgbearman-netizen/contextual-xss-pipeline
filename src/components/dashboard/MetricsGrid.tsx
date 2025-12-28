import { MetricCard } from "@/components/ui/MetricCard";
import {
  Globe,
  Fingerprint,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface MetricsGridProps {
  metrics: {
    totalTargets: number;
    totalEndpoints: number;
    activeInjections: number;
    totalCallbacks: number;
    confirmedFindings: number;
    highRiskInputs: number;
  };
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard
        title="Targets Scanned"
        value={metrics.totalTargets.toLocaleString()}
        subtitle="Total domains"
        icon={Globe}
        variant="primary"
      />
      <MetricCard
        title="Endpoints Found"
        value={metrics.totalEndpoints.toLocaleString()}
        subtitle={`High-risk: ${metrics.highRiskInputs}`}
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
        title="Callbacks Received"
        value={metrics.totalCallbacks.toLocaleString()}
        subtitle="OOB correlations"
        icon={AlertTriangle}
        variant={metrics.totalCallbacks > 0 ? "destructive" : "default"}
      />
      <MetricCard
        title="Confirmed Vulns"
        value={metrics.confirmedFindings.toLocaleString()}
        subtitle="Validated findings"
        icon={CheckCircle}
        variant={metrics.confirmedFindings > 0 ? "success" : "default"}
      />
      <MetricCard
        title="Avg. Response"
        value="--"
        subtitle="Pending data"
        icon={Clock}
      />
    </div>
  );
}
