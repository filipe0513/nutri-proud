'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/store';
import { StoryHeader } from '@/components/shared/StoryHeader';
import { Card, CardContent } from '@/components/ui/card';
import {
  Utensils,
  Moon,
  Dumbbell,
  Smile,
  StickyNote
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MealEqualizerDrawer } from '@/components/shared/MealEqualizerDrawer';
import { WorkoutEqualizerDrawer } from '@/components/shared/WorkoutEqualizerDrawer';
import { BottomSheet_Water } from '@/components/shared/BottomSheet_Water';
import { BottomSheet_Sleep } from '@/components/shared/BottomSheet_Sleep';
import { BottomSheet_Poop } from '@/components/shared/BottomSheet_Poop';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { DynamicStreakCard } from '@/components/shared/DynamicStreakCard';

export default function DashboardPage() {
  const { addLog } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [userId, setUserId] = useState<string>('');

  // Get anonymous userId from cookie for streak calculation
  useEffect(() => {
    const match = document.cookie.match(/anon_user_id=([^;]+)/);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (match) setUserId(decodeURIComponent(match[1]));
  }, []);

  return (
    <div className="pb-24 pt-8 px-6 max-w-lg mx-auto space-y-8">
      <StoryHeader onCategorySelect={setSelectedCategory} />

      {/* Dynamic Streak Card */}
      {userId && <DynamicStreakCard userId={userId} />}

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-title-2 text-neutral-500 px-1">Ações Rápidas</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <BottomSheet_Water />
          <MealEqualizerDrawer />
          <WorkoutEqualizerDrawer />
          <BottomSheet_Sleep />
          <BottomSheet_Poop />

          <Drawer>
            <DrawerTrigger asChild>
              <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group aspect-square flex flex-col items-center justify-center">
                <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
                  <div className="h-16 w-16 rounded-2xl bg-highlight-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <StickyNote className="h-8 w-8 text-highlight-300" />
                  </div>
                  <p className="text-body-1 font-bold text-neutral-500 text-center px-2">Nota</p>
                </CardContent>
              </Card>
            </DrawerTrigger>
            <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
              <DrawerHeader className="px-0">
                <DrawerTitle className="text-title-2 text-neutral-500">Adicionar Nota</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col mt-4 space-y-4">
                <textarea 
                  className="flex min-h-[120px] w-full rounded-2xl border border-white/40 bg-glass-light-2 backdrop-blur-sm px-4 py-3 text-input-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  placeholder="Como você está se sentindo? Alguma observação?"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <DrawerClose asChild>
                  <Button 
                    className="h-14 rounded-2xl bg-brand-500 text-white text-button-1"
                    onClick={() => {
                      if (!noteText.trim()) return;
                      addLog({
                        event_time: new Date().toISOString(),
                        category: 'note',
                        primary_value: 100,
                        details: { notes: noteText }
                      });
                      toast.success('Nota salva com sucesso!', {
                        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success'
                      });
                      setNoteText('');
                    }}
                  >
                    Salvar Nota
                  </Button>
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

    </div>
  );
}
