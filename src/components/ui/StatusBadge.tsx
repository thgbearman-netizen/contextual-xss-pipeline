import { cn } from "@/lib/utils";

type Status = "active" | "idle" | "critical" | "success" | "warning";

interface StatusBadgeProps {
  status: Status;
  label: string;
  pulse?: boolean;
  className?: string;
}

const statusStyles: Record<Status, string> = {
  active: "bg-primary/20 text-primary border-primary/40",
  idle: "bg-muted text-muted-foreground border-border",
  critical: "bg-destructive/20 text-destructive border-destructive/40",
  success: "bg-success/20 text-success border-success/40",
  warning: "bg-warning/20 text-warning border-warning/40",
};

const dotStyles: Record<Status, string> = {
  active: "bg-primary",
  idle: "bg-muted-foreground",
  critical: "bg-destructive",
  success: "bg-success",
  warning: "bg-warning",
};

export function StatusBadge({ status, label, pulse = false, className }: StatusBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium font-mono uppercase tracking-wider",
        statusStyles[status],
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              dotStyles[status]
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", dotStyles[status])} />
      </span>
      {label}
    </div>
  );
}
