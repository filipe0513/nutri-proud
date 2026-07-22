'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from './UserAvatar';
import { NotificationsSheet } from './NotificationsSheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ArrowLeft, LogOut, Settings, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/store/store';
import { signOut } from 'next-auth/react';

export type TopHeaderLeftAction = 'avatar' | 'back' | 'none';
export type TopHeaderRightAction = 'notifications' | 'none';

interface TopHeaderProps {
  leftAction?: TopHeaderLeftAction;
  rightAction?: TopHeaderRightAction;
  title?: string;
  rightElement?: React.ReactNode;
  onBack?: () => void;
}

export function TopHeader({
  leftAction = 'avatar',
  rightAction = 'notifications',
  title,
  rightElement,
  onBack,
}: TopHeaderProps) {
  const router = useRouter();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const { user_profile } = useAppStore();

  const handleBack = () => {
    if (onBack) onBack();
    else router.push('/');
  };

  const handleLogout = async () => {
    await fetch('/api/sessions', { method: 'DELETE' });
    signOut({ callbackUrl: '/welcome' });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full bg-glass-light-1/80 backdrop-blur-md border-b border-white/20">
      <div className="mx-auto w-full max-w-lg px-4 md:px-6 flex justify-between items-center h-16">
        
        {/* Left Action */}
        <div className="flex items-center w-12">
          {leftAction === 'avatar' && (
            <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
              <SheetTrigger asChild>
                <button 
                  aria-label="Menu Principal"
                  className="flex items-center justify-center bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-full w-10 h-10 hover:bg-glass-light-2 transition-all group"
                >
                  <UserAvatar size="sm" className="ring-2 ring-white/60 group-hover:scale-105 transition-transform" />
                </button>
              </SheetTrigger>

              <SheetContent side="left" className="w-72 sm:max-w-md bg-glass-light-3 backdrop-blur-lg border-r border-white/40 p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-white/20 relative text-left">
                  <div className="flex items-center space-x-4">
                    <UserAvatar size="lg" />
                    <div>
                      <SheetTitle className="text-title-2 text-neutral-500 leading-tight">
                        {user_profile?.name || 'Explorador'}
                      </SheetTitle>
                      <p className="text-caption-1 text-neutral-400 truncate">
                        {user_profile?.email || 'Sem email'}
                      </p>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 flex flex-col space-y-1 px-3">
                  <SheetClose asChild>
                    <Link href="/settings" className="flex items-center space-x-3 px-4 py-3 rounded-2xl hover:bg-white/40 transition-colors text-neutral-500 font-medium active:scale-[0.98]">
                      <div className="h-8 w-8 rounded-full bg-white/50 flex items-center justify-center text-neutral-400">
                        <Settings className="h-4 w-4" />
                      </div>
                      <span>Configurações</span>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/history" className="flex items-center space-x-3 px-4 py-3 rounded-2xl hover:bg-white/40 transition-colors text-neutral-500 font-medium active:scale-[0.98]">
                      <div className="h-8 w-8 rounded-full bg-white/50 flex items-center justify-center text-neutral-400">
                        <Clock className="h-4 w-4" />
                      </div>
                      <span>Histórico</span>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/squads" className="flex items-center space-x-3 px-4 py-3 rounded-2xl hover:bg-white/40 transition-colors text-neutral-500 font-medium active:scale-[0.98]">
                      <div className="h-8 w-8 rounded-full bg-white/50 flex items-center justify-center text-neutral-400">
                        <Users className="h-4 w-4" />
                      </div>
                      <span>Comunidade (Squads)</span>
                    </Link>
                  </SheetClose>
                </div>

                <div className="p-6 border-t border-white/20">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 py-3 rounded-2xl transition-colors font-semibold"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          )}

          {leftAction === 'back' && (
            <button 
              onClick={handleBack}
              aria-label="Voltar"
              className="flex items-center justify-center bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-full w-10 h-10 hover:bg-glass-light-2 transition-all text-neutral-500 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center Content: Title or Logo */}
        <div className="flex-1 flex justify-center items-center">
          {title ? (
            <h1 className="text-title-3 font-bold text-neutral-500">{title}</h1>
          ) : (
            <Image
              src="/logo-color-h.webp"
              alt="Orgulho da Nutri"
              width={1332}
              height={281}
              priority
              unoptimized
              className="h-6 w-auto"
            />
          )}
        </div>

        {/* Right Action */}
        <div className="flex items-center justify-end w-12">
          {rightElement ? (
            rightElement
          ) : rightAction === 'notifications' ? (
            <NotificationsSheet 
              open={rightOpen} 
              onOpenChange={setRightOpen}
              customTrigger={
                <button 
                  aria-label="Abrir notificações"
                  className="relative flex items-center justify-center bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-full w-10 h-10 hover:bg-glass-light-2 transition-all group"
                >
                  <NotificationsUnreadBadge />
                </button>
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Pequeno componente para o ícone de sino e badge
function NotificationsUnreadBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch('/api/notifications')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (mounted) setUnreadCount(data.filter((n: { isRead: boolean }) => !n.isRead).length);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 group-hover:text-brand-500 transition-colors">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-white text-[9px] font-bold leading-none px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </span>
      )}
    </>
  );
}
