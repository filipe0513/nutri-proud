'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Share2, Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onShareClick?: () => void;
  onAddLogClick?: () => void;
}

export function BottomNav({ onShareClick, onAddLogClick }: BottomNavProps) {
  const pathname = usePathname();

  // Hide nav when inside a Story/Pillar screen or a specific Team feed
  if (
    pathname.startsWith('/pillar') ||
    pathname.startsWith('/profile') ||
    (pathname.startsWith('/teams/') && pathname !== '/teams')
  )
    return null;

  const leftItems = [
    { label: 'Início', icon: Home, href: '/' },
    { label: 'Histórico', icon: History, href: '/history' },
  ];

  const rightItems = [
    { label: 'Nutri', icon: Share2, href: null as null, onClick: onShareClick },
    { label: 'Times', icon: Users, href: '/teams' },
  ];

  return (
    <nav
      className="fixed bottom-6 left-4 right-4 md:bottom-0 md:left-0 md:right-0 md:w-full md:translate-x-0 h-[68px] bg-glass-light-2 backdrop-blur-md border border-white/40 shadow-xl rounded-full md:rounded-none md:border-x-0 md:border-b-0 z-50"
      aria-label="Navegação principal"
    >
      <div className="w-full h-full md:max-w-lg md:mx-auto md:px-6 flex items-center justify-around px-2 md:px-0">
      {/* Left: Home + Histórico */}
      {leftItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              'flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300',
              isActive
                ? 'bg-glass-light-3 border border-white/40 text-brand-500 scale-110 shadow-sm'
                : 'text-neutral-500/80 hover:text-brand-400 hover:bg-glass-light-1',
            )}
          >
            <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
            <span className={cn('text-caption-2 mt-0.5', isActive ? 'font-bold' : 'font-medium')}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Centre: FAB "+" */}
      <button
        type="button"
        id="btn-fab-add-log"
        aria-label="Registrar atividade"
        onClick={onAddLogClick}
        className="relative flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-brand-500 to-brand-400 shadow-lg shadow-brand-500/40 text-white hover:from-brand-400 hover:to-brand-300 active:scale-95 transition-all duration-200 -translate-y-4 ring-4 ring-white/60"
      >
        <Plus className="h-7 w-7 stroke-[2.5px]" />
      </button>

      {/* Right: Compartilhar + Times */}
      {rightItems.map((item) => {
        const isActive = item.href ? pathname === item.href : false;

        if (!item.href) {
          return (
            <button
              key={item.label}
              type="button"
              id="btn-share-nutri"
              aria-label={item.label}
              onClick={item.onClick}
              className={cn(
                'flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300',
                'text-neutral-500/80 hover:text-brand-400 hover:bg-glass-light-1',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-caption-2 mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              'flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300',
              isActive
                ? 'bg-glass-light-3 border border-white/40 text-brand-500 scale-110 shadow-sm'
                : 'text-neutral-500/80 hover:text-brand-400 hover:bg-glass-light-1',
            )}
          >
            <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
            <span className={cn('text-caption-2 mt-0.5', isActive ? 'font-bold' : 'font-medium')}>
              {item.label}
            </span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
