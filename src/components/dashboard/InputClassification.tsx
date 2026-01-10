import { Layers, AlertTriangle, Loader2 } from "lucide-react";

interface InputClassificationProps {
  classification: Record<string, number>;
  isLoading: boolean;
}

interface InputClass {
  category: string;
  key: string;
  description: string;
  risk: "low" | "medium" | "high" | "critical";
}

const inputClasses: InputClass[] = [
  { category: "SOQL Query", key: "soql_query", description: "Dynamic SOQL construction", risk: "critical" },
  { category: "Aura Actions", key: "aura_action", description: "Exposed Aura controller actions", risk: "critical" },
  { category: "Guest Aura", key: "guest_aura", description: "Unauthenticated Aura access", risk: "critical" },
  { category: "Apex Controller", key: "apex_controller", description: "Custom Apex REST endpoints", risk: "high" },
  { category: "Visualforce", key: "visualforce", description: "VF page parameters", risk: "high" },
  { category: "LWC Component", key: "lwc_component", description: "Lightning Web Components", risk: "medium" },
  { category: "Record Access", key: "record_access", description: "Direct record access patterns", risk: "high" },
  { category: "SSRF Endpoint", key: "ssrf_endpoint", description: "Server-side request targets", risk: "critical" },
];

const riskStyles: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
};

const riskBarStyles: Record<string, string> = {
  low: "bg-muted-foreground",
  medium: "bg-warning",
  high: "bg-orange-500",
  critical: "bg-destructive",
};

export function InputClassification({ classification, isLoading }: InputClassificationProps) {
  const totalCount = Object.values(classification).reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...Object.values(classification), 1);
  const criticalCount = inputClasses
    .filter(c => c.risk === 'critical')
    .reduce((sum, c) => sum + (classification[c.key] || 0), 0);

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
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/30">
            <Layers className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Salesforce Vectors</h2>
            <p className="text-sm text-muted-foreground">Attack surface classification</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
        {totalCount === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No vectors classified yet.</p>
          </div>
        ) : (
          inputClasses.map((inputClass, index) => {
            const count = classification[inputClass.key] || 0;
            if (count === 0) return null;
            return (
              <div key={inputClass.key} className="group animate-slide-in" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground">{inputClass.category}</h4>
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium uppercase rounded border ${riskStyles[inputClass.risk]}`}>
                      {inputClass.risk}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${riskBarStyles[inputClass.risk]}`} style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {criticalCount > 0 && (
        <div className="p-4 border-t border-border bg-muted/20 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-xs text-muted-foreground">
            <span className="text-destructive font-medium">{criticalCount}</span> critical vectors prioritized
          </p>
        </div>
      )}
    </div>
  );
}
