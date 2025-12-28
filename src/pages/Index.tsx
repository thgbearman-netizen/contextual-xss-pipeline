import { Header } from "@/components/dashboard/Header";
import { PipelineOverview } from "@/components/dashboard/PipelineOverview";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { SurfaceDiscoveryTable } from "@/components/dashboard/SurfaceDiscoveryTable";
import { CallbackLog } from "@/components/dashboard/CallbackLog";
import { InputClassification } from "@/components/dashboard/InputClassification";
import { TerminalLog } from "@/components/dashboard/TerminalLog";
import { useScanData } from "@/hooks/useScanData";

const Index = () => {
  const { 
    endpoints, 
    callbacks, 
    logs, 
    metrics, 
    isLoading, 
    isScanning, 
    startScan 
  } = useScanData();

  return (
    <div className="min-h-screen bg-background">
      <Header onStartScan={startScan} isScanning={isScanning} />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Pipeline Status */}
        <section className="animate-fade-in">
          <PipelineOverview metrics={metrics} isScanning={isScanning} />
        </section>

        {/* Metrics Grid */}
        <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <MetricsGrid metrics={metrics} />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Surface Discovery - 2 columns */}
          <section className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <SurfaceDiscoveryTable endpoints={endpoints} isLoading={isLoading} />
          </section>

          {/* Input Classification - 1 column */}
          <section className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <InputClassification classification={metrics.inputClassification} isLoading={isLoading} />
          </section>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Callback Log */}
          <section className="animate-fade-in" style={{ animationDelay: "400ms" }}>
            <CallbackLog callbacks={callbacks} isLoading={isLoading} />
          </section>

          {/* Terminal Log */}
          <section className="animate-fade-in" style={{ animationDelay: "500ms" }}>
            <TerminalLog logs={logs} isLoading={isLoading} />
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
              <span>Targets: {metrics.totalTargets}</span>
              <span>•</span>
              <span>Endpoints: {metrics.totalEndpoints}</span>
              <span>•</span>
              <span>Findings: {metrics.confirmedFindings}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
