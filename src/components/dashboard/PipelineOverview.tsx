import { PipelineStage } from "@/components/ui/PipelineStage";
import {
  Radar,
  Layers,
  Crosshair,
  Radio,
  FileCheck,
} from "lucide-react";

interface PipelineOverviewProps {
  metrics: {
    totalEndpoints: number;
    activeInjections: number;
    totalCallbacks: number;
    confirmedFindings: number;
  };
  isScanning: boolean;
}

export function PipelineOverview({ metrics, isScanning }: PipelineOverviewProps) {
  const getStageStatus = (stage: string): "pending" | "active" | "complete" | "error" => {
    if (isScanning) {
      if (stage === "discovery") return "active";
      return "pending";
    }
    
    switch (stage) {
      case "discovery":
        return metrics.totalEndpoints > 0 ? "complete" : "pending";
      case "classification":
        return metrics.totalEndpoints > 0 ? "complete" : "pending";
      case "inference":
        return metrics.activeInjections > 0 ? "active" : metrics.totalEndpoints > 0 ? "complete" : "pending";
      case "correlation":
        return metrics.totalCallbacks > 0 ? "complete" : metrics.activeInjections > 0 ? "active" : "pending";
      case "validation":
        return metrics.confirmedFindings > 0 ? "complete" : "pending";
      default:
        return "pending";
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    if (metrics.totalEndpoints > 0) completed += 2;
    if (metrics.activeInjections > 0) completed += 1;
    if (metrics.totalCallbacks > 0) completed += 1;
    if (metrics.confirmedFindings > 0) completed += 1;
    return Math.round((completed / 5) * 100);
  };

  const pipelineStages = [
    {
      title: "Surface Discovery",
      description: isScanning ? "Scanning..." : `${metrics.totalEndpoints} endpoints`,
      icon: Radar,
      status: getStageStatus("discovery"),
    },
    {
      title: "Input Classification",
      description: "CMS-aware analysis",
      icon: Layers,
      status: getStageStatus("classification"),
    },
    {
      title: "Context Inference",
      description: `${metrics.activeInjections} active`,
      icon: Crosshair,
      status: getStageStatus("inference"),
    },
    {
      title: "OOB Correlation",
      description: `${metrics.totalCallbacks} callbacks`,
      icon: Radio,
      status: getStageStatus("correlation"),
    },
    {
      title: "Validation",
      description: `${metrics.confirmedFindings} findings`,
      icon: FileCheck,
      status: getStageStatus("validation"),
    },
  ];

  return (
    <div className="card-cyber rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pipeline Status</h2>
          <p className="text-sm text-muted-foreground">Real-time execution flow</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-primary">{calculateProgress()}%</p>
          <p className="text-xs text-muted-foreground">Overall Progress</p>
        </div>
      </div>
      
      <div className="flex items-center overflow-x-auto pb-2 scrollbar-hide">
        {pipelineStages.map((stage, index) => (
          <PipelineStage
            key={stage.title}
            {...stage}
            isLast={index === pipelineStages.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
