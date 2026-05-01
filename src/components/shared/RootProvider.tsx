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
    if (!mounted) return;

    const isSetupPage = pathname === '/welcome' || pathname === '/onboarding';
    
    if (!userProfile && !isSetupPage) {
      router.push('/welcome');
    } else if (userProfile && isSetupPage) {
      router.push('/');
    }
  }, [mounted, userProfile, pathname, router]);

  if (!mounted || loadingData) return null;

  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}
