'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/store';
import { StoryHeader } from '@/components/shared/StoryHeader';
import { StoryCircle } from '@/components/shared/StoryCircle';
import { ScoreCard } from '@/components/shared/ScoreCard';
import { InsightsBanner } from '@/components/shared/InsightsBanner';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Droplets, Utensils, Dumbbell, Moon, Smile, StickyNote } from 'lucide-react';
import { MealEqualizerDrawer } from '@/components/shared/MealEqualizerDrawer';
import { WorkoutEqualizerDrawer } from '@/components/shared/WorkoutEqualizerDrawer';
import { BottomSheet_Water } from '@/components/shared/BottomSheet_Water';
import { BottomSheet_Sleep } from '@/components/shared/BottomSheet_Sleep';
import { BottomSheet_Poop } from '@/components/shared/BottomSheet_Poop';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LimitWarningDrawer } from '@/components/shared/LimitWarningDrawer';

const CATEGORY_COLORS: Record<string, string> = {
  water: 'var(--color-cat-water)',
  food: 'var(--color-cat-food)',
  workout: 'var(--color-cat-workout)',
  sleep: 'var(--color-cat-sleep)',
  poop: 'var(--color-cat-poop)',
};

// Maps story category id → drawer id
const STORY_TO_DRAWER: Record<string, 'water' | 'meal' | 'workout' | 'sleep' | 'poop'> = {
  water: 'water',
  food: 'meal',
  workout: 'workout',
  sleep: 'sleep',
  poop: 'poop',
};

const PROGRESS_CATEGORIES = [
  { id: 'water', label: 'Água', icon: Droplets },
  { id: 'food', label: 'Comida', icon: Utensils },
  { id: 'workout', label: 'Treino', icon: Dumbbell },
  { id: 'sleep', label: 'Sono', icon: Moon },
  { id: 'poop', label: 'Intestino', icon: Smile },
];

const ACTION_LIST = [
  { id: 'water', label: 'Registrar água', icon: Droplets, color: 'var(--color-cat-water)', bg: 'bg-blue-50' },
  { id: 'meal', label: 'Registrar refeição', icon: Utensils, color: 'var(--color-cat-food)', bg: 'bg-green-50' },
  { id: 'workout', label: 'Registrar treino', icon: Dumbbell, color: 'var(--color-cat-workout)', bg: 'bg-red-50' },
  { id: 'sleep', label: 'Registrar sono', icon: Moon, color: 'var(--color-cat-sleep)', bg: 'bg-slate-100' },
  { id: 'poop', label: 'Registrar intestino', icon: Smile, color: 'var(--color-cat-poop)', bg: 'bg-amber-50' },
  { id: 'note', label: 'Adicionar nota', icon: StickyNote, color: 'var(--color-highlight-300)', bg: 'bg-yellow-50' },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addLog, user_profile, activity_logs, initializeData } = useAppStore();
  const [noteText, setNoteText] = useState('');

  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  const isLimitReached = user_profile?.is_anonymous && activity_logs.length >= 11;

  // We use global state to allow the FAB in BottomNav to open drawers programmatically
  const openDrawer = useAppStore(state => state.activeDrawer);
  const setOpenDrawer = useAppStore(state => state.setActiveDrawer);

  // Detecta redirecionamento pós-conversão de conta anônima → real
  useEffect(() => {
    if (searchParams.get('merged') === 'true') {
      initializeData().then(() => {
        toast.success('Conta criada! Seus dados foram preservados. 🎉', {
          className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
        });
        router.replace('/');
      });
    }
  // Executar apenas na montagem (ou quando o parâmetro mudar)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Progress calculation for each category
  const todayLogs = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return activity_logs
      .filter(log => new Date(log.event_time) >= startOfDay)
      .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());
  }, [activity_logs]);

  const getProgress = (catId: string) => {
    const catLogs = todayLogs.filter(log => log.category === catId);
    if (catLogs.length === 0) return 0;

    if (catId === 'water') {
      // Proportional to daily water target
      const total = catLogs.reduce((acc, log) => acc + (log.details?.quantity_ml || 0), 0);
      return Math.min(100, Math.round((total / (user_profile?.targets?.water_ml_per_day || 2000)) * 100));
    }

    if (catId === 'food') {
      // Average quality of logged meals × proportion of meals target met
      const rawTargets = user_profile?.targets as Record<string, unknown> | undefined;
      const plannedMeals = Array.isArray(rawTargets?.planned_meals) ? rawTargets.planned_meals : [];
      const mealsTarget = plannedMeals.length || 4;
      const avgQuality = catLogs.reduce((acc, log) => acc + log.primary_value, 0) / catLogs.length;
      const mealsProportion = Math.min(1, catLogs.length / mealsTarget);
      return Math.min(100, Math.round(avgQuality * mealsProportion));
    }

    // sleep, workout, poop: average of primary_value (already computed in each drawer)
    const avg = catLogs.reduce((acc, log) => acc + log.primary_value, 0) / catLogs.length;
    return Math.min(100, Math.round(avg));
  };


  const renderActionItem = (action: typeof ACTION_LIST[number], trigger: React.ReactNode) => {
    return (
      <div
        key={action.id}
        onClickCapture={(e) => {
          if (isLimitReached) {
            e.preventDefault();
            e.stopPropagation();
            setPendingAction(action.id);
            setIsWarningOpen(true);
          }
        }}
      >
        {trigger}
      </div>
    );
  };

  const actionTrigger = (action: typeof ACTION_LIST[number]) => (
    <div className="flex items-center bg-white rounded-2xl px-4 py-4 border border-neutral-200/60 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group">
      <div className={`h-10 w-10 rounded-full ${action.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
        <action.icon className="h-5 w-5" style={{ color: action.color }} />
      </div>
      <span className="text-body-1 font-medium text-neutral-500 ml-4 flex-1">
        {action.label}
      </span>
      <ChevronRight className="h-4 w-4 text-neutral-300" />
    </div>
  );

  return (
    <div className="pb-24 pt-8 px-6 max-w-lg mx-auto space-y-6">
      {/* 1. Greeting + Streak Badge */}
      <StoryHeader />

      {/* 2. Score Card */}
      <ScoreCard />

      {/* 3. Progresso de Hoje (below Score Card) */}
      <div className="space-y-3">
        <p className="text-body-2 font-semibold text-neutral-400">
          Progresso de hoje
        </p>
        <div className="flex justify-between overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
          {PROGRESS_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-label={`Registrar ${cat.label}`}
              className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-full"
              onClick={() => {
                const drawerId = STORY_TO_DRAWER[cat.id];
                if (isLimitReached) {
                  setPendingAction(drawerId);
                  setIsWarningOpen(true);
                } else {
                  setOpenDrawer(drawerId);
                }
              }}
            >
              <StoryCircle
                label={cat.label}
                icon={cat.icon}
                value={getProgress(cat.id)}
                color={CATEGORY_COLORS[cat.id]}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 4. Insights Banner */}
      <InsightsBanner />

      {/* 5. Quick Actions — Vertical List */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 px-1">
          <Sparkles className="h-4 w-4 text-neutral-400" />
          <p className="text-body-2 font-semibold text-neutral-400">
            Ações rápidas
          </p>
        </div>

        <div className="space-y-3">
          {/* Water */}
          {renderActionItem(ACTION_LIST[0], (
            <BottomSheet_Water
              open={openDrawer === 'water' ? true : undefined}
              onOpenChange={(o) => o ? setOpenDrawer('water') : setOpenDrawer(null)}
              customTrigger={actionTrigger(ACTION_LIST[0])}
            />
          ))}

          {/* Meal */}
          {renderActionItem(ACTION_LIST[1], (
            <MealEqualizerDrawer
              open={openDrawer === 'meal' ? true : undefined}
              onOpenChange={(o) => o ? setOpenDrawer('meal') : setOpenDrawer(null)}
              customTrigger={actionTrigger(ACTION_LIST[1])}
            />
          ))}

          {/* Workout */}
          {renderActionItem(ACTION_LIST[2], (
            <WorkoutEqualizerDrawer
              open={openDrawer === 'workout' ? true : undefined}
              onOpenChange={(o) => o ? setOpenDrawer('workout') : setOpenDrawer(null)}
              customTrigger={actionTrigger(ACTION_LIST[2])}
            />
          ))}

          {/* Sleep */}
          {renderActionItem(ACTION_LIST[3], (
            <BottomSheet_Sleep
              open={openDrawer === 'sleep' ? true : undefined}
              onOpenChange={(o) => o ? setOpenDrawer('sleep') : setOpenDrawer(null)}
              customTrigger={actionTrigger(ACTION_LIST[3])}
            />
          ))}

          {/* Poop */}
          {renderActionItem(ACTION_LIST[4], (
            <BottomSheet_Poop
              open={openDrawer === 'poop' ? true : undefined}
              onOpenChange={(o) => o ? setOpenDrawer('poop') : setOpenDrawer(null)}
              customTrigger={actionTrigger(ACTION_LIST[4])}
            />
          ))}

          {/* Note */}
          {renderActionItem(ACTION_LIST[5], (
            <Drawer open={openDrawer === 'note' || undefined} onOpenChange={(o) => o ? setOpenDrawer('note') : setOpenDrawer(null)}>
              <DrawerTrigger asChild>
                {actionTrigger(ACTION_LIST[5])}
              </DrawerTrigger>
              <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
                <DrawerHeader className="px-0">
                  <DrawerTitle className="text-title-2 text-neutral-500">Adicionar Nota</DrawerTitle>
                </DrawerHeader>
                <div className="flex flex-col mt-4 space-y-4">
                  <textarea 
                    className="flex min-h-[120px] w-full rounded-2xl border border-neutral-200/60 bg-neutral-100 px-4 py-3 text-input-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
          ))}
        </div>
      </div>

      <LimitWarningDrawer 
        isOpen={isWarningOpen} 
        onClose={() => setIsWarningOpen(false)} 
        onContinueAnyway={() => {
          if (pendingAction) {
            setOpenDrawer(pendingAction as 'water' | 'meal' | 'workout' | 'sleep' | 'poop' | 'note');
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="pb-24 pt-8 px-6" />}>
      <DashboardContent />
    </Suspense>
  );
}
