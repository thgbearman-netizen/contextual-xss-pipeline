import { Terminal as TerminalIcon, Loader2 } from "lucide-react";
import type { ScanLog } from "@/lib/api";

interface TerminalLogProps {
  logs: ScanLog[];
  isLoading: boolean;
}

const levelStyles: Record<string, string> = {
  info: "text-primary",
  warn: "text-warning",
  error: "text-destructive",
  success: "text-success",
};

export function TerminalLog({ logs, isLoading }: TerminalLogProps) {
  if (isLoading) {
    return (
      <div className="card-cyber rounded-lg border border-border p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="card-cyber rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Live Terminal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          <span className="h-2 w-2 rounded-full bg-warning" />
          <span className="h-2 w-2 rounded-full bg-success" />
        </div>
      </div>

      <div className="bg-background/80 p-4 h-64 overflow-y-auto font-mono text-xs space-y-1.5 relative">
        <div className="absolute inset-0 scanline pointer-events-none" />
        
        {logs.length === 0 ? (
          <div className="text-muted-foreground">
            <span className="text-primary">▶</span> Awaiting scan commands...
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id}
              className="flex items-start gap-3 animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <span className="text-muted-foreground shrink-0">
                [{new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false })}]
              </span>
              <span className={`shrink-0 uppercase font-medium ${levelStyles[log.level] || levelStyles.info}`}>
                [{log.level.padEnd(7)}]
              </span>
              <span className="text-foreground/90">{log.message}</span>
            </div>
          ))
        )}
        
        <div className="flex items-center gap-1 text-primary">
          <span>▌</span>
          <span className="animate-pulse">_</span>
        </div>
      </div>
    </div>
  );
}
