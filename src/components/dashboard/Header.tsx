import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Terminal, Shield, Settings, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  onStartScan: (domain: string) => Promise<void>;
  isScanning: boolean;
}

export function Header({ onStartScan, isScanning }: HeaderProps) {
  const [domain, setDomain] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    try {
      await onStartScan(domain.trim());
      toast({
        title: "Scan Started",
        description: `Surface discovery initiated for ${domain}`,
      });
      setDomain("");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-gradient-primary">BLIND</span>
                  <span className="text-foreground">-XSS</span>
                </h1>
                <p className="text-xs text-muted-foreground font-mono">
                  Automation Pipeline v2.0
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-border mx-2" />
            <StatusBadge status={isScanning ? "active" : "idle"} label={isScanning ? "Scanning" : "System Ready"} pulse={isScanning} />
          </div>

          <div className="flex items-center gap-3">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Scan
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Start New Scan</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <Input
                    type="text"
                    placeholder="Enter target domain (e.g., example.com)"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="bg-background border-border"
                    disabled={isScanning}
                  />
                  <Button type="submit" className="w-full" disabled={isScanning || !domain.trim()}>
                    {isScanning ? "Scanning..." : "Start Surface Discovery"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Terminal className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
