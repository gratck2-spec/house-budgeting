"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Users, CalendarCheck, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Ringkasan", icon: Home },
  { href: "/pengeluaran", label: "Pengeluaran", icon: Receipt },
  { href: "/tukang", label: "Tukang", icon: Users },
  { href: "/absen", label: "Absen", icon: CalendarCheck },
  { href: "/gaji", label: "Gaji", icon: Calculator },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border no-print">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full rounded-xl mx-1 transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1 transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}