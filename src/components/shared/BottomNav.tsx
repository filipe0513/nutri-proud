'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, History, Users, Plus, TrendingUp, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/store';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface BottomNavProps {
  onAddLogClick?: () => void;
}

export function BottomNav({ onAddLogClick }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAnonymous = useAppStore((s) => s.user_profile?.is_anonymous ?? false);
  const [showRegister, setShowRegister] = useState(false);

  // Hide nav when inside a Story/Pillar screen or a public profile
  if (pathname.startsWith('/pillar') || pathname.startsWith('/profile')) return null;

  const leftItems = [
    { label: 'Início', icon: Home, href: '/' },
    { label: 'Histórico', icon: History, href: '/history' },
  ];

  const rightItems = [
    { label: 'Evolução', icon: TrendingUp, href: '/evolution' },
    { label: 'Times', icon: Users, href: '/teams' },
  ];

  return (
    <>
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

        {/* Right: Evolução + Times */}
        {rightItems.map((item) => {
          const isActive = pathname === item.href;

          if (isAnonymous) {
            return (
              <button
                key={item.href}
                type="button"
                aria-label={item.label}
                onClick={() => setShowRegister(true)}
                className="flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 text-neutral-500/40 opacity-50"
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

      <Drawer open={showRegister} onOpenChange={(open) => !open && setShowRegister(false)}>
        <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-8">
          <DrawerHeader className="px-0 flex flex-col items-center text-center space-y-4 pt-6">
            <div className="h-16 w-16 rounded-full bg-brand-500/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-brand-500" />
            </div>
            <DrawerTitle className="text-title-2 text-neutral-600">Funcionalidade exclusiva</DrawerTitle>
            <DrawerDescription className="text-body-1 text-neutral-500/80">
              Crie uma conta gratuita para acessar sua evolução, participar de times e muito mais.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="px-0 pt-6 space-y-3">
            <Button
              className="w-full h-14 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-button-1 shadow-md transition-all"
              onClick={() => {
                setShowRegister(false);
                router.push('/welcome?forceLogin=true');
              }}
            >
              Criar conta grátis
            </Button>
            <Button
              variant="ghost"
              className="w-full h-14 rounded-2xl text-neutral-500 hover:bg-neutral-100 font-medium text-button-1"
              onClick={() => setShowRegister(false)}
            >
              Agora não
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
