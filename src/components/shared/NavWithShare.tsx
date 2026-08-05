'use client';

import { usePathname, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/shared/BottomNav';
import { AddLogOptionsDrawer } from '@/components/shared/AddLogOptionsDrawer';
import { useAppStore } from '@/store/store';

export function NavWithShare() {
  const { isAddLogOpen, setAddLogOpen, setActiveDrawer } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleSelectPillar = (pillar: 'water' | 'meal' | 'workout' | 'sleep' | 'poop' | 'jacada') => {
    setActiveDrawer(pillar, 'FAB');
    if (pathname !== '/') {
      router.push('/');
    }
  };

  return (
    <>
      <BottomNav 
        onAddLogClick={() => setAddLogOpen(true)}
      />
      <AddLogOptionsDrawer 
        open={isAddLogOpen} 
        onOpenChange={setAddLogOpen} 
        onSelectPillar={handleSelectPillar}
      />
    </>
  );
}
