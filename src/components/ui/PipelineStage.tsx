import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";

interface PipelineStageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: "pending" | "active" | "complete" | "error";
  isLast?: boolean;
  progress?: number;
}

const statusStyles = {
  pending: {
    container: "border-border bg-card",
    icon: "text-muted-foreground bg-muted",
    connector: "bg-border",
  },
  active: {
    container: "border-primary/50 bg-primary/5 glow-primary",
    icon: "text-primary bg-primary/20",
    connector: "bg-gradient-to-r from-primary to-border",
  },
  complete: {
    container: "border-success/50 bg-success/5",
    icon: "text-success bg-success/20",
    connector: "bg-success",
  },
  error: {
    container: "border-destructive/50 bg-destructive/5",
    icon: "text-destructive bg-destructive/20",
    connector: "bg-destructive",
  },
};

export function PipelineStage({
  title,
  description,
  icon: Icon,
  status,
  isLast = false,
  progress,
}: PipelineStageProps) {
  const styles = statusStyles[status];

  return (
    <div className="flex items-center">
      <div
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
          styles.container
        )}
      >
        <div className={cn("p-2.5 rounded-lg", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          {status === "active" && progress !== undefined && (
            <div className="mt-2 h-1 w-32 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        {status === "active" && (
          <div className="absolute -inset-px rounded-lg animate-pulse-glow pointer-events-none" />
        )}
      </div>
      {!isLast && (
        <div className="flex items-center px-2">
          <div className={cn("h-0.5 w-8", styles.connector)} />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
