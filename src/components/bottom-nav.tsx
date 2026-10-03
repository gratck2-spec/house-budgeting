'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, Users, CalendarCheck, Calculator } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Ringkasan', icon: Home },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: Receipt },
  { href: '/tukang', label: 'Tukang', icon: Users },
  { href: '/absen', label: 'Absen', icon: CalendarCheck },
  { href: '/gaji', label: 'Gaji', icon: Calculator },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full text-xs transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}