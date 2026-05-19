'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/shared/BottomNav';
import { ShareReportDrawer } from '@/components/shared/ShareReportDrawer';
import { AddLogOptionsDrawer } from '@/components/shared/AddLogOptionsDrawer';
import { useAppStore } from '@/store/store';

export function NavWithShare() {
  const [shareOpen, setShareOpen] = useState(false);
  const { isAddLogOpen, setAddLogOpen, setActiveDrawer } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleSelectPillar = (pillar: 'water' | 'meal' | 'workout' | 'sleep' | 'poop' | 'jacada') => {
    setActiveDrawer(pillar);
    if (pathname !== '/') {
      router.push('/');
    }
  };

  return (
    <>
      <BottomNav 
        onShareClick={() => setShareOpen(true)} 
        onAddLogClick={() => setAddLogOpen(true)}
      />
      <ShareReportDrawer open={shareOpen} onOpenChange={setShareOpen} />
      <AddLogOptionsDrawer 
        open={isAddLogOpen} 
        onOpenChange={setAddLogOpen} 
        onSelectPillar={handleSelectPillar}
      />
    </>
  );
}
