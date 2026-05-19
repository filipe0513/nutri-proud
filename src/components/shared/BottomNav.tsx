'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Settings, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onShareClick?: () => void;
}

export function BottomNav({ onShareClick }: BottomNavProps) {
  const pathname = usePathname();

  // Hide nav when inside a Story/Pillar screen or Settings
  if (pathname.startsWith('/pillar') || pathname.startsWith('/settings') || pathname.startsWith('/profile')) return null;

  const navItems = [
    {
      label: 'Histórico',
      icon: History,
      href: '/history',
    },
    {
      label: 'Início',
      icon: Home,
      href: '/',
    },
    {
      label: 'Config',
      icon: Settings,
      href: '/settings',
    },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[460px] h-20 bg-glass-light-2 backdrop-blur-md border border-white/40 shadow-xl rounded-full flex items-center justify-around px-4 z-50">
      {navItems.slice(0, 2).map((item) => {
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
            <span className={cn(
              "text-caption-2 mt-0.5",
              isActive ? "font-bold" : "font-medium"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Share Button — centre action */}
      <button
        type="button"
        id="btn-share-nutri"
        aria-label="Mandar para Nutri"
        onClick={onShareClick}
        className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-purple-500 shadow-lg text-white hover:bg-purple-600 active:scale-95 transition-all duration-200 relative -top-4 ring-4 ring-purple-100"
      >
        <Share2 className="h-6 w-6 stroke-[2px]" />
        <span className="text-[9px] font-semibold mt-0.5 leading-tight text-center">
          Nutri
        </span>
      </button>

      {/* Remaining nav items */}
      {navItems.slice(2).map((item) => {
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
            <span className={cn(
              "text-caption-2 mt-0.5",
              isActive ? "font-bold" : "font-medium"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
