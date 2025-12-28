import { Header } from "@/components/dashboard/Header";
import { PipelineOverview } from "@/components/dashboard/PipelineOverview";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { SurfaceDiscoveryTable } from "@/components/dashboard/SurfaceDiscoveryTable";
import { CallbackLog } from "@/components/dashboard/CallbackLog";
import { InputClassification } from "@/components/dashboard/InputClassification";
import { TerminalLog } from "@/components/dashboard/TerminalLog";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Pipeline Status */}
        <section className="animate-fade-in">
          <PipelineOverview />
        </section>

        {/* Metrics Grid */}
        <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <MetricsGrid />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Surface Discovery - 2 columns */}
          <section className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <SurfaceDiscoveryTable />
          </section>

          {/* Input Classification - 1 column */}
          <section className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <InputClassification />
          </section>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Callback Log */}
          <section className="animate-fade-in" style={{ animationDelay: "400ms" }}>
            <CallbackLog />
          </section>

          {/* Terminal Log */}
          <section className="animate-fade-in" style={{ animationDelay: "500ms" }}>
            <TerminalLog />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="font-mono">BLIND-XSS v2.0.4</span>
              <span>•</span>
              <span>Built for authorized security testing only</span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>Uptime: 99.7%</span>
              <span>•</span>
              <span>Memory: 847MB</span>
              <span>•</span>
              <span>CPU: 23%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
