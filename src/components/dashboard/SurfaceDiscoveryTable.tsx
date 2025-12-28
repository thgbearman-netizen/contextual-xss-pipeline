import { StatusBadge } from "@/components/ui/StatusBadge";
import { ExternalLink, Shield, AlertCircle, Loader2 } from "lucide-react";
import type { Endpoint } from "@/lib/api";

interface SurfaceDiscoveryTableProps {
  endpoints: Endpoint[];
  isLoading: boolean;
}

const riskColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-warning",
  high: "text-orange-500",
  critical: "text-destructive",
};

const methodColors: Record<string, string> = {
  GET: "bg-success/20 text-success",
  POST: "bg-primary/20 text-primary",
  PUT: "bg-warning/20 text-warning",
  DELETE: "bg-destructive/20 text-destructive",
  PATCH: "bg-accent/20 text-accent",
};

const statusMap: Record<string, "active" | "idle" | "critical" | "success" | "warning"> = {
  discovered: "idle",
  classified: "idle",
  testing: "active",
  vulnerable: "critical",
  clean: "success",
};

export function SurfaceDiscoveryTable({ endpoints, isLoading }: SurfaceDiscoveryTableProps) {
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
          <div>
            <h2 className="text-lg font-semibold text-foreground">Surface Discovery</h2>
            <p className="text-sm text-muted-foreground">Discovered endpoints and parameters</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {endpoints.length} endpoints
            </span>
          </div>
        </div>
      </div>

      {endpoints.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <p className="text-sm">No endpoints discovered yet.</p>
          <p className="text-xs mt-1">Start a new scan to discover targets.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Endpoint
                </th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Method
                </th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Parameters
                </th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  CMS
                </th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Risk
                </th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint, index) => (
                <tr
                  key={endpoint.id}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-foreground">
                        {endpoint.endpoint}
                      </code>
                      {endpoint.auth_required && (
                        <Shield className="h-3.5 w-3.5 text-warning" />
                      )}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                        methodColors[endpoint.method] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {(endpoint.params as string[]).slice(0, 3).map((param) => (
                        <span
                          key={param}
                          className="px-2 py-0.5 bg-secondary rounded text-xs font-mono text-secondary-foreground"
                        >
                          {param}
                        </span>
                      ))}
                      {(endpoint.params as string[]).length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{(endpoint.params as string[]).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {endpoint.cms || "Custom"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle
                        className={`h-3.5 w-3.5 ${riskColors[endpoint.risk_level] || riskColors.low}`}
                      />
                      <span
                        className={`text-xs font-medium uppercase ${
                          riskColors[endpoint.risk_level] || riskColors.low
                        }`}
                      >
                        {endpoint.risk_level}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge
                      status={statusMap[endpoint.status] || "idle"}
                      label={endpoint.status}
                      pulse={endpoint.status === "testing"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
