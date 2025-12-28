import { Layers, AlertTriangle, Info } from "lucide-react";

interface InputClass {
  category: string;
  description: string;
  count: number;
  risk: "low" | "medium" | "high" | "critical";
  examples: string[];
}

const inputClasses: InputClass[] = [
  {
    category: "Display Content",
    description: "User-visible content rendered in HTML",
    count: 2847,
    risk: "high",
    examples: ["post body", "comments", "bio"],
  },
  {
    category: "Log Sinks",
    description: "Values written to log viewers/exports",
    count: 892,
    risk: "critical",
    examples: ["user-agent", "referer", "IP"],
  },
  {
    category: "Admin-Only Fields",
    description: "Backend settings accessible to admins",
    count: 234,
    risk: "critical",
    examples: ["config values", "plugin settings"],
  },
  {
    category: "Metadata",
    description: "Titles, slugs, and descriptive fields",
    count: 1456,
    risk: "medium",
    examples: ["title", "slug", "meta description"],
  },
  {
    category: "API Fields",
    description: "JSON/API input parameters",
    count: 3505,
    risk: "medium",
    examples: ["request body", "query params"],
  },
];

const riskStyles = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
};

const riskBarStyles = {
  low: "bg-muted-foreground",
  medium: "bg-warning",
  high: "bg-orange-500",
  critical: "bg-destructive",
};

export function InputClassification() {
  const maxCount = Math.max(...inputClasses.map((c) => c.count));

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
        {inputClasses.map((inputClass, index) => (
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
                {inputClass.count.toLocaleString()}
              </span>
            </div>

            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  riskBarStyles[inputClass.risk]
                }`}
                style={{ width: `${(inputClass.count / maxCount) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Info className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {inputClass.description}
              </p>
              <span className="text-xs text-muted-foreground">•</span>
              <div className="flex gap-1">
                {inputClass.examples.slice(0, 2).map((ex) => (
                  <code
                    key={ex}
                    className="px-1.5 py-0.5 bg-secondary rounded text-xs font-mono text-secondary-foreground"
                  >
                    {ex}
                  </code>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-muted/20 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <p className="text-xs text-muted-foreground">
          <span className="text-warning font-medium">1,126</span> high-risk inputs prioritized for injection
        </p>
      </div>
    </div>
  );
}
