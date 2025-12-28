import { StatusBadge } from "@/components/ui/StatusBadge";
import { ExternalLink, Shield, AlertCircle } from "lucide-react";

interface Endpoint {
  id: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  params: string[];
  auth: boolean;
  cms: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  status: "scanned" | "testing" | "vulnerable" | "clean";
}

const mockEndpoints: Endpoint[] = [
  {
    id: "1",
    endpoint: "/wp-admin/admin-ajax.php",
    method: "POST",
    params: ["action", "content", "title"],
    auth: true,
    cms: "WordPress",
    riskLevel: "high",
    status: "vulnerable",
  },
  {
    id: "2",
    endpoint: "/api/v1/comments",
    method: "POST",
    params: ["body", "author", "email"],
    auth: false,
    cms: "Custom",
    riskLevel: "critical",
    status: "testing",
  },
  {
    id: "3",
    endpoint: "/node/add/article",
    method: "POST",
    params: ["title", "body", "field_tags"],
    auth: true,
    cms: "Drupal",
    riskLevel: "high",
    status: "scanned",
  },
  {
    id: "4",
    endpoint: "/index.php?option=com_contact",
    method: "POST",
    params: ["contact_name", "contact_email", "contact_message"],
    auth: false,
    cms: "Joomla",
    riskLevel: "medium",
    status: "clean",
  },
  {
    id: "5",
    endpoint: "/admin/settings/logs",
    method: "GET",
    params: ["filter", "search"],
    auth: true,
    cms: "Custom",
    riskLevel: "high",
    status: "vulnerable",
  },
];

const riskColors = {
  low: "text-muted-foreground",
  medium: "text-warning",
  high: "text-orange-500",
  critical: "text-destructive",
};

const methodColors = {
  GET: "bg-success/20 text-success",
  POST: "bg-primary/20 text-primary",
  PUT: "bg-warning/20 text-warning",
  DELETE: "bg-destructive/20 text-destructive",
};

export function SurfaceDiscoveryTable() {
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
              {mockEndpoints.length} endpoints
            </span>
          </div>
        </div>
      </div>

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
            {mockEndpoints.map((endpoint, index) => (
              <tr
                key={endpoint.id}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-foreground">
                      {endpoint.endpoint}
                    </code>
                    {endpoint.auth && (
                      <Shield className="h-3.5 w-3.5 text-warning" />
                    )}
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                      methodColors[endpoint.method]
                    }`}
                  >
                    {endpoint.method}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {endpoint.params.map((param) => (
                      <span
                        key={param}
                        className="px-2 py-0.5 bg-secondary rounded text-xs font-mono text-secondary-foreground"
                      >
                        {param}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm text-muted-foreground">
                    {endpoint.cms}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle
                      className={`h-3.5 w-3.5 ${riskColors[endpoint.riskLevel]}`}
                    />
                    <span
                      className={`text-xs font-medium uppercase ${
                        riskColors[endpoint.riskLevel]
                      }`}
                    >
                      {endpoint.riskLevel}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <StatusBadge
                    status={
                      endpoint.status === "vulnerable"
                        ? "critical"
                        : endpoint.status === "testing"
                        ? "active"
                        : endpoint.status === "clean"
                        ? "success"
                        : "idle"
                    }
                    label={endpoint.status}
                    pulse={endpoint.status === "testing"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
