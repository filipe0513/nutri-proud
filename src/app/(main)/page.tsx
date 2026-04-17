'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StoryCircle } from '@/components/shared/StoryCircle';
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
  ChevronRight,
  Home,
  X,
  StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionCardWithDrawer } from '@/components/shared/ActionCardWithDrawer';
import { MealEqualizerDrawer } from '@/components/shared/MealEqualizerDrawer';
import { WorkoutEqualizerDrawer } from '@/components/shared/WorkoutEqualizerDrawer';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DashboardPage() {
  const { user_profile, activity_logs, addLog } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isStreakDismissed, setIsStreakDismissed] = useState(false);
  const [noteText, setNoteText] = useState('');

  const todayLogs = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return activity_logs.filter(log => new Date(log.event_time) >= startOfDay);
  }, [activity_logs]);

  const categories = [
    { id: 'water', label: 'Água', icon: Droplets, target: user_profile?.targets.water_ml_per_day || 2000, unit: 'ml' },
    { id: 'food', label: 'Comida', icon: Utensils, target: user_profile?.targets.meals_per_day || 4, unit: 'ref' },
    { id: 'workout', label: 'Treino', icon: Dumbbell, target: 1, unit: 'sessão' },
    { id: 'sleep', label: 'Sono', icon: Moon, target: user_profile?.targets.sleep_hours_per_night || 8, unit: 'h' },
    { id: 'poop', label: 'Intestino', icon: Smile, target: 1, unit: 'vez' },
  ];

  const getProgress = (catId: string) => {
    const catLogs = todayLogs.filter(log => log.category === catId);
    if (catId === 'water') {
      const total = catLogs.reduce((acc, log) => acc + (log.details?.quantity_ml || 0), 0);
      return Math.min(100, (total / (user_profile?.targets.water_ml_per_day || 2000)) * 100);
    }
    if (catId === 'food') {
      return Math.min(100, (catLogs.length / (user_profile?.targets.meals_per_day || 4)) * 100);
    }
    // Simple for others for now
    return catLogs.length > 0 ? 100 : 0;
  };

  return (
    <div className="pb-24 pt-8 px-6 max-w-lg mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 font-medium">Olá,</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{user_profile?.name || 'Explorador'}</h1>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          <Settings className="h-6 w-6 text-slate-400" />
        </div>
      </div>

      {/* Stories */}
      <div className="flex justify-between overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
        {categories.map((cat) => (
          <StoryCircle
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            value={getProgress(cat.id)}
            onClick={() => setSelectedCategory(cat.id)}
          />
        ))}
      </div>

      {/* Streak Card */}
      <AnimatePresence>
        {!isStreakDismissed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-900 text-white rounded-3xl border-none shadow-2xl overflow-hidden relative">
              <button 
                onClick={() => setIsStreakDismissed(true)}
                className="absolute top-4 right-4 z-10 p-2 bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-slate-300" />
              </button>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Flame className="h-24 w-24" />
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-orange-500 p-2 rounded-xl">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-lg">3 Dias de Fogo</span>
                </div>
                <p className="text-slate-300 text-sm">Você está indo muito bem! Continue assim para bater seu recorde.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 px-1">Ações Rápidas</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <ActionCardWithDrawer
            category="water"
            icon={Droplets}
            iconColorClass="text-blue-500"
            iconBgClass="bg-blue-50"
            title="Água"
            drawerTitle="Quanto você bebeu?"
            options={[
              { label: "250ml (Copo)", value: 250, primaryValue: 100 },
              { label: "500ml (Garrafa)", value: 500, primaryValue: 100 },
              { label: "1L (Jarra)", value: 1000, primaryValue: 100 },
              { label: "Outro", value: "custom", primaryValue: 100, suffix: "ml" },
            ]}
            onLogDetails={(v) => ({ quantity_ml: v })}
          />

          <MealEqualizerDrawer />

          <WorkoutEqualizerDrawer />

          <ActionCardWithDrawer
            category="sleep"
            icon={Moon}
            iconColorClass="text-indigo-500"
            iconBgClass="bg-indigo-50"
            title="Sono"
            drawerTitle="Como foi seu sono?"
            options={[
              { label: "Mais de 8h", value: ">8h", primaryValue: 100 },
              { label: "6 a 8h", value: "6-8h", primaryValue: 80 },
              { label: "Menos de 6h", value: "<6h", primaryValue: 40 },
              { label: "Outro", value: "custom", primaryValue: 100, suffix: "h" },
            ]}
            onLogDetails={(v) => ({ duration: v })}
          />

          <ActionCardWithDrawer
            category="poop"
            icon={Smile}
            iconColorClass="text-green-500"
            iconBgClass="bg-green-50"
            title="Intestino"
            drawerTitle="Como funcionou hoje?"
            options={[
              { label: "Tudo Certo", value: "normal", primaryValue: 100 },
              { label: "Prisão de Ventre", value: "constipation", primaryValue: 50 },
              { label: "Diarreia", value: "diarrhea", primaryValue: 50 },
            ]}
            onLogDetails={(v) => ({ state: v })}
          />

          <Drawer>
            <DrawerTrigger asChild>
              <Card className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group aspect-square flex flex-col items-center justify-center">
                <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
                  <div className="h-16 w-16 rounded-2xl bg-yellow-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <StickyNote className="h-8 w-8 text-yellow-500" />
                  </div>
                  <p className="font-bold text-slate-900 text-sm text-center px-2">Nota</p>
                </CardContent>
              </Card>
            </DrawerTrigger>
            <DrawerContent className="bg-white rounded-t-[40px] px-6 pb-12">
              <DrawerHeader className="px-0">
                <DrawerTitle className="text-2xl font-bold">Adicionar Nota</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col mt-4 space-y-4">
                <textarea 
                  className="flex min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  placeholder="Como você está se sentindo? Alguma observação?"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <DrawerClose asChild>
                  <Button 
                    className="h-14 rounded-2xl bg-slate-900 text-white font-bold"
                    onClick={() => {
                      if (!noteText.trim()) return;
                      addLog({
                        event_time: new Date().toISOString(),
                        category: 'note',
                        primary_value: 100,
                        details: { notes: noteText }
                      });
                      toast.success('Nota salva com sucesso!');
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

      {/* Bottom Nav */}
      <div className="fixed bottom-6 left-6 right-6 h-20 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[32px] shadow-2xl flex items-center justify-around px-4">
        <Link href="/" className="flex flex-col items-center space-y-1 text-slate-900">
          <div className="p-2 bg-slate-900 rounded-2xl">
            <Home className="h-6 w-6 text-white" />
          </div>
        </Link>
        <Link href="/history" className="flex flex-col items-center space-y-1 text-slate-400 hover:text-slate-600 transition-colors">
          <History className="h-6 w-6" />
        </Link>
        <button className="flex flex-col items-center space-y-1 text-slate-400 hover:text-slate-600 transition-colors">
          <Settings className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
