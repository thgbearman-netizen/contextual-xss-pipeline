import { PipelineStage } from "@/components/ui/PipelineStage";
import {
  Radar,
  Layers,
  Crosshair,
  Radio,
  FileCheck,
} from "lucide-react";

const pipelineStages = [
  {
    title: "Surface Discovery",
    description: "Scanning targets",
    icon: Radar,
    status: "complete" as const,
  },
  {
    title: "Input Classification",
    description: "CMS-aware analysis",
    icon: Layers,
    status: "complete" as const,
  },
  {
    title: "Context Inference",
    description: "Payload mapping",
    icon: Crosshair,
    status: "active" as const,
    progress: 67,
  },
  {
    title: "OOB Correlation",
    description: "Callback monitoring",
    icon: Radio,
    status: "pending" as const,
  },
  {
    title: "Validation",
    description: "Report generation",
    icon: FileCheck,
    status: "pending" as const,
  },
];

export function PipelineOverview() {
  return (
    <div className="card-cyber rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pipeline Status</h2>
          <p className="text-sm text-muted-foreground">Real-time execution flow</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-primary">67%</p>
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
