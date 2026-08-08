'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Rss, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NutriBottomNav() {
  const pathname = usePathname();

  // Ocultar em rotas específicas (ex: settings)
  if (pathname.includes('/settings')) return null;

  const items = [
    { label: 'Insights', icon: Activity, href: '/dashboard/insights' },
    { label: 'Feed', icon: Rss, href: '/dashboard' },
    { label: 'Consultório', icon: Users, href: '/dashboard/teams' },
  ];

  return (
    <nav
      className="fixed bottom-6 left-4 right-4 md:hidden h-[68px] bg-glass-light-2 backdrop-blur-md border border-white/40 shadow-xl rounded-full z-50"
      aria-label="Navegação da Nutricionista"
    >
      <div className="w-full h-full flex items-center justify-around px-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
             <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all duration-300',
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
