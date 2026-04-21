'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/store';
import { StoryHeader } from '@/components/shared/StoryHeader';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Droplets, 
  Utensils, 
  Moon, 
  Dumbbell, 
  Smile,
  Plus,
  History,
  Settings,
  Flame,
  X,
  StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MealEqualizerDrawer } from '@/components/shared/MealEqualizerDrawer';
import { WorkoutEqualizerDrawer } from '@/components/shared/WorkoutEqualizerDrawer';
import { BottomSheet_Water } from '@/components/shared/BottomSheet_Water';
import { BottomSheet_Sleep } from '@/components/shared/BottomSheet_Sleep';
import { BottomSheet_Poop } from '@/components/shared/BottomSheet_Poop';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DashboardPage() {
  const { addLog } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isStreakDismissed, setIsStreakDismissed] = useState(false);
  const [noteText, setNoteText] = useState('');

  return (
    <div className="pb-24 pt-8 px-6 max-w-lg mx-auto space-y-8">
      <StoryHeader onCategorySelect={setSelectedCategory} />

      {/* Streak Card */}
      <AnimatePresence>
        {!isStreakDismissed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-glass-dark-2 backdrop-blur-md text-white rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative">
              <button 
                onClick={() => setIsStreakDismissed(true)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Flame className="h-24 w-24" />
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-notify-warning p-2 rounded-xl">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-title-3">3 Dias de Fogo</span>
                </div>
                <p className="text-body-2 text-white/80">Você está indo muito bem! Continue assim para bater seu recorde.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
