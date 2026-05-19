/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/store';
import { Toaster } from '@/components/ui/sonner';

export function RootProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const userProfile = useAppStore((state) => state.user_profile);
  const initializeData = useAppStore((state) => state.initializeData);
  const [mounted, setMounted] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    setMounted(true);
    initializeData().finally(() => setLoadingData(false));
  }, [initializeData]);

  useEffect(() => {
    // Don't make routing decisions until data is fully loaded
    if (!mounted || loadingData) return;

    const isSetupPage = pathname === '/welcome' || pathname === '/onboarding';
    
    // Se for a página de welcome e estiver com forceLogin=true, permite o acesso
    const isForceLogin = pathname === '/welcome' && window.location.search.includes('forceLogin=true');
    
    if (!userProfile && !isSetupPage) {
      router.push('/welcome');
    } else if (userProfile && isSetupPage && !isForceLogin) {
      router.push('/');
    }
  }, [mounted, loadingData, userProfile, pathname, router]);

  if (!mounted || loadingData) return null;

  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}
