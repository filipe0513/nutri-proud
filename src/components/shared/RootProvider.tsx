'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Toaster } from '@/components/ui/sonner';

export function RootProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const userProfile = useAppStore((state) => state.user_profile);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isSetupPage = pathname === '/welcome' || pathname === '/onboarding';
    
    if (!userProfile && !isSetupPage) {
      router.push('/welcome');
    } else if (userProfile && isSetupPage) {
      router.push('/');
    }
  }, [mounted, userProfile, pathname, router]);

  if (!mounted) return null;

  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}
