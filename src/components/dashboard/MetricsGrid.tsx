import { MetricCard } from "@/components/ui/MetricCard";
import {
  Globe,
  Fingerprint,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard
        title="Targets Scanned"
        value="1,247"
        subtitle="Across 42 domains"
        icon={Globe}
        trend="up"
        trendValue="+12%"
        variant="primary"
      />
      <MetricCard
        title="Inputs Classified"
        value="8,934"
        subtitle="High-risk: 234"
        icon={Fingerprint}
        trend="up"
        trendValue="+8%"
      />
      <MetricCard
        title="Active Injections"
        value="156"
        subtitle="Awaiting callback"
        icon={Zap}
        variant="warning"
      />
      <MetricCard
        title="Callbacks Received"
        value="23"
        subtitle="Last 24 hours"
        icon={AlertTriangle}
        trend="up"
        trendValue="+3"
        variant="destructive"
      />
      <MetricCard
        title="Confirmed Vulns"
        value="7"
        subtitle="Validated & reported"
        icon={CheckCircle}
        variant="success"
      />
      <MetricCard
        title="Avg. Response"
        value="3.2h"
        subtitle="Callback delay"
        icon={Clock}
      />
    </div>
  );
}
