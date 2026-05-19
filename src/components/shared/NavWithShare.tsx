'use client';

import { useState } from 'react';
import { BottomNav } from '@/components/shared/BottomNav';
import { ShareReportDrawer } from '@/components/shared/ShareReportDrawer';

export function NavWithShare() {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <BottomNav onShareClick={() => setShareOpen(true)} />
      <ShareReportDrawer open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
