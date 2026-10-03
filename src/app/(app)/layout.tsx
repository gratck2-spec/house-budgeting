import { BottomNav } from "@/components/bottom-nav";
import { DarkToggle } from "@/components/dark-toggle";
import { House } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <House className="h-5 w-5" />
            </div>
            <span className="font-heading font-bold text-lg">BangunRumah</span>
          </div>
          <DarkToggle />
        </div>
      </header>
      <main className="p-4 max-w-2xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}