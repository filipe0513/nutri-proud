'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Início',
      icon: Home,
      href: '/',
    },
    {
      label: 'Diário',
      icon: History,
      href: '/history',
    },
    {
      label: 'Ajustes',
      icon: Settings,
      href: '/settings',
    },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] h-20 bg-glass-light-2 backdrop-blur-md border border-white/40 shadow-xl rounded-full flex items-center justify-around px-6 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300",
              isActive 
                ? "bg-glass-light-3 border border-white/40 text-brand-500 scale-110 shadow-sm" 
                : "text-neutral-500/80 hover:text-brand-400 hover:bg-glass-light-1"
            )}
          >
            <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
            {/* Optional label for accessibility/clarity, currently hidden to keep it minimal as requested, or we can show it */}
            <span className="sr-only">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
