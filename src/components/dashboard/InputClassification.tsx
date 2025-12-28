import { Layers, AlertTriangle, Loader2 } from "lucide-react";

interface InputClassificationProps {
  classification: {
    display_content: number;
    log_sink: number;
    admin_only: number;
    metadata: number;
    api_field: number;
  };
  isLoading: boolean;
}

interface InputClass {
  category: string;
  key: keyof InputClassificationProps['classification'];
  description: string;
  risk: "low" | "medium" | "high" | "critical";
}

const inputClasses: InputClass[] = [
  {
    category: "Display Content",
    key: "display_content",
    description: "User-visible content rendered in HTML",
    risk: "high",
  },
  {
    category: "Log Sinks",
    key: "log_sink",
    description: "Values written to log viewers/exports",
    risk: "critical",
  },
  {
    category: "Admin-Only Fields",
    key: "admin_only",
    description: "Backend settings accessible to admins",
    risk: "critical",
  },
  {
    category: "Metadata",
    key: "metadata",
    description: "Titles, slugs, and descriptive fields",
    risk: "medium",
  },
  {
    category: "API Fields",
    key: "api_field",
    description: "JSON/API input parameters",
    risk: "medium",
  },
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
  const highRiskCount = classification.display_content + classification.log_sink + classification.admin_only;

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
            <h2 className="text-lg font-semibold text-foreground">Input Classification</h2>
            <p className="text-sm text-muted-foreground">CMS-aware parameter categorization</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {totalCount === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No inputs classified yet.</p>
          </div>
        ) : (
          inputClasses.map((inputClass, index) => {
            const count = classification[inputClass.key];
            return (
              <div
                key={inputClass.category}
                className="group animate-slide-in"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground">
                      {inputClass.category}
                    </h4>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium uppercase rounded border ${
                        riskStyles[inputClass.risk]
                      }`}
                    >
                      {inputClass.risk}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {count.toLocaleString()}
                  </span>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      riskBarStyles[inputClass.risk]
                    }`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {inputClass.description}
                </p>
              </div>
            );
          })
        )}
      </div>

      {highRiskCount > 0 && (
        <div className="p-4 border-t border-border bg-muted/20 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <p className="text-xs text-muted-foreground">
            <span className="text-warning font-medium">{highRiskCount}</span> high-risk inputs prioritized for injection
          </p>
        </div>
      )}
    </div>
  );
}
