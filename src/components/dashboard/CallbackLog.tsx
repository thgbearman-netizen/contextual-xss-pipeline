import { StatusBadge } from "@/components/ui/StatusBadge";
import { Radio, Clock, Globe, User, ArrowRight } from "lucide-react";

interface Callback {
  id: string;
  token: string;
  source: {
    endpoint: string;
    param: string;
  };
  callback: {
    type: "http" | "dns" | "smtp";
    delay: string;
    userAgent: string;
    ip: string;
  };
  timestamp: string;
  confidence: "low" | "medium" | "high";
}

const mockCallbacks: Callback[] = [
  {
    id: "cb1",
    token: "xss_a7f3c2",
    source: {
      endpoint: "/wp-admin/admin-ajax.php",
      param: "content",
    },
    callback: {
      type: "http",
      delay: "3h 24m",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ip: "192.168.1.x",
    },
    timestamp: "2024-01-15 14:32:18",
    confidence: "high",
  },
  {
    id: "cb2",
    token: "xss_b8e4d1",
    source: {
      endpoint: "/api/v1/comments",
      param: "body",
    },
    callback: {
      type: "dns",
      delay: "12m",
      userAgent: "Internal-Scanner/1.0",
      ip: "10.0.0.x",
    },
    timestamp: "2024-01-15 14:28:45",
    confidence: "low",
  },
  {
    id: "cb3",
    token: "xss_c9f5e2",
    source: {
      endpoint: "/admin/settings/logs",
      param: "search",
    },
    callback: {
      type: "http",
      delay: "6h 12m",
      userAgent: "Chrome/120.0 (Admin Panel)",
      ip: "172.16.x.x",
    },
    timestamp: "2024-01-15 14:15:33",
    confidence: "high",
  },
];

const typeColors = {
  http: "text-primary bg-primary/10",
  dns: "text-warning bg-warning/10",
  smtp: "text-success bg-success/10",
};

const confidenceColors = {
  low: "idle" as const,
  medium: "warning" as const,
  high: "success" as const,
};

export function CallbackLog() {
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

      <div className="divide-y divide-border/50">
        {mockCallbacks.map((callback, index) => (
          <div
            key={callback.id}
            className="p-5 hover:bg-muted/20 transition-colors animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <code className="px-2 py-1 bg-primary/10 text-primary rounded font-mono text-sm">
                    {callback.token}
                  </code>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${typeColors[callback.callback.type]}`}>
                    {callback.callback.type}
                  </span>
                  <StatusBadge
                    status={confidenceColors[callback.confidence]}
                    label={`${callback.confidence} confidence`}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <code className="text-muted-foreground font-mono">
                    {callback.source.endpoint}
                  </code>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="px-2 py-0.5 bg-secondary rounded text-xs font-mono text-secondary-foreground">
                    {callback.source.param}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Delay: <span className="text-foreground font-medium">{callback.callback.delay}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="font-mono">{callback.callback.ip}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[200px]">{callback.callback.userAgent}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground font-mono">{callback.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-muted/20">
        <p className="text-xs text-muted-foreground text-center font-mono">
          Monitoring: interactsh.lovable.app • Last ping: 2s ago
        </p>
      </div>
    </div>
  );
}
