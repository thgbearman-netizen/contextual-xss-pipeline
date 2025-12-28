import { StatusBadge } from "@/components/ui/StatusBadge";
import { Radio, Clock, Globe, User, ArrowRight, Loader2 } from "lucide-react";

interface CallbackLogProps {
  callbacks: any[];
  isLoading: boolean;
}

const typeColors: Record<string, string> = {
  http: "text-primary bg-primary/10",
  dns: "text-warning bg-warning/10",
  smtp: "text-success bg-success/10",
};

const confidenceColors: Record<string, "idle" | "warning" | "success"> = {
  low: "idle",
  medium: "warning",
  high: "success",
};

function formatDelay(seconds: number | null): string {
  if (!seconds) return "--";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function CallbackLog({ callbacks, isLoading }: CallbackLogProps) {
  if (isLoading) {
    return (
      <div className="card-cyber rounded-lg border border-border p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="card-cyber rounded-lg border border-border overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Radio className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">OOB Callback Log</h2>
              <p className="text-sm text-muted-foreground">Real-time callback correlation</p>
            </div>
          </div>
          <StatusBadge status="active" label="Listening" pulse />
        </div>
      </div>

      {callbacks.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <p className="text-sm">No callbacks received yet.</p>
          <p className="text-xs mt-1">Waiting for OOB interactions...</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {callbacks.map((callback, index) => (
            <div
              key={callback.id}
              className="p-5 hover:bg-muted/20 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <code className="px-2 py-1 bg-primary/10 text-primary rounded font-mono text-sm">
                      {callback.injections?.token || "unknown"}
                    </code>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${typeColors[callback.callback_type] || typeColors.http}`}>
                      {callback.callback_type}
                    </span>
                    <StatusBadge
                      status={confidenceColors[callback.confidence] || "idle"}
                      label={`${callback.confidence} confidence`}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <code className="text-muted-foreground font-mono">
                      {callback.injections?.endpoints?.endpoint || "unknown"}
                    </code>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="px-2 py-0.5 bg-secondary rounded text-xs font-mono text-secondary-foreground">
                      {callback.injections?.param || "unknown"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Delay: <span className="text-foreground font-medium">{formatDelay(callback.delay_seconds)}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      <span className="font-mono">{callback.source_ip || "unknown"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">{callback.user_agent || "unknown"}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-mono">
                    {new Date(callback.received_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-border bg-muted/20">
        <p className="text-xs text-muted-foreground text-center font-mono">
          Monitoring: oob-callback endpoint • Last ping: 2s ago
        </p>
      </div>
    </div>
  );
}
