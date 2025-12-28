import { Terminal as TerminalIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

const initialLogs: LogEntry[] = [
  { timestamp: "14:32:18", level: "success", message: "Callback received: xss_a7f3c2 → admin panel access confirmed" },
  { timestamp: "14:32:15", level: "info", message: "Injecting context-aware probe into /api/v1/comments [body]" },
  { timestamp: "14:32:12", level: "warn", message: "Rate limit detected on target: example.com (backing off 30s)" },
  { timestamp: "14:32:08", level: "info", message: "Surface scan complete: 47 new endpoints discovered" },
  { timestamp: "14:32:05", level: "info", message: "CMS fingerprint: WordPress 6.4.2 + WooCommerce 8.x" },
  { timestamp: "14:32:01", level: "error", message: "Failed to reach OOB listener: retrying in 5s" },
  { timestamp: "14:31:58", level: "success", message: "Token correlation: xss_b8e4d1 matched → low confidence (scanner UA)" },
];

const levelStyles = {
  info: "text-primary",
  warn: "text-warning",
  error: "text-destructive",
  success: "text-success",
};

export function TerminalLog() {
  const [logs, setLogs] = useState(initialLogs);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }).slice(0, 8),
        level: ["info", "info", "info", "warn", "success"][Math.floor(Math.random() * 5)] as LogEntry["level"],
        message: [
          "Scanning endpoint: /wp-json/wp/v2/posts",
          "Parameter classified: content → display_content (HIGH)",
          "OOB listener heartbeat: OK",
          "Injection queued: log-trigger probe for /admin/logs",
          "Context inference: HTML body detected",
        ][Math.floor(Math.random() * 5)],
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
        {logs.map((log, index) => (
          <div
            key={`${log.timestamp}-${index}`}
            className="flex items-start gap-3 animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <span className="text-muted-foreground shrink-0">[{log.timestamp}]</span>
            <span className={`shrink-0 uppercase font-medium ${levelStyles[log.level]}`}>
              [{log.level.padEnd(7)}]
            </span>
            <span className="text-foreground/90">{log.message}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-primary">
          <span>▌</span>
          <span className="animate-pulse">_</span>
        </div>
      </div>
    </div>
  );
}
