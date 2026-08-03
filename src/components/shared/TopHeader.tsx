'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from './UserAvatar';
import { NotificationsSheet } from './NotificationsSheet';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
  const [rightOpen, setRightOpen] = useState(false);

  const handleBack = () => {
    if (onBack) onBack();
    else router.push('/');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full bg-glass-light-1/80 backdrop-blur-md border-b border-white/20">
      <div className="mx-auto w-full max-w-lg px-4 md:px-6 flex justify-between items-center h-16">
        
        {/* Left Action */}
        <div className="flex items-center w-12">
          {leftAction === 'avatar' && (
            <Link 
              href="/settings"
              aria-label="Configurações"
              className="flex items-center justify-center bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-full w-10 h-10 hover:bg-glass-light-2 transition-all group"
            >
              <UserAvatar size="sm" className="ring-2 ring-white/60 group-hover:scale-105 transition-transform" />
            </Link>
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
