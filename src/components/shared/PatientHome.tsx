'use client';

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/store';
import { StoryHeader } from '@/components/shared/StoryHeader';
import { StoryCircle } from '@/components/shared/StoryCircle';
import { ScoreCard } from '@/components/shared/ScoreCard';
import { InsightsBanner } from '@/components/shared/InsightsBanner';
import { InsightsDrawer } from '@/components/shared/InsightsDrawer';
import { WeeklyStreak } from '@/components/shared/WeeklyStreak';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Droplets, Utensils, Dumbbell, Moon, Smile, StickyNote } from 'lucide-react';
import { JacadaDrawer } from '@/components/shared/JacadaDrawer';
import { BottomSheet_Water } from '@/components/shared/BottomSheet_Water';
import { MealEqualizerDrawer } from '@/components/shared/MealEqualizerDrawer';
import { WorkoutEqualizerDrawer } from '@/components/shared/WorkoutEqualizerDrawer';
import { BottomSheet_Sleep } from '@/components/shared/BottomSheet_Sleep';
import { BottomSheet_Poop } from '@/components/shared/BottomSheet_Poop';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LimitWarningDrawer } from '@/components/shared/LimitWarningDrawer';
import { LifesaverDrawer } from '@/components/shared/LifesaverDrawer';
import { TopHeader } from '@/components/shared/TopHeader';
import { AdminViewSwitcher } from '@/components/shared/AdminViewSwitcher';
import { toLocalISOString } from '@/lib/utils';
import { calculateWaterScore, calculateFoodScore } from '@/utils/scoreUtils';
import { getLocalStartOfDay } from '@/utils/dateUtils';
import { LifeBuoy } from 'lucide-react';

/** Modelo local do AiInsight retornado pela API */
interface AiInsight {
  id: string;
  message: string;
  cta: string | null;
  isViewed: boolean;
  createdAt: string;
}

/** Retorna true se o insight foi criado há menos de 4 horas */
function isFresh(createdAt: string): boolean {
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  return Date.now() - new Date(createdAt).getTime() < FOUR_HOURS_MS;
}

const CATEGORY_COLORS: Record<string, string> = {
  water: 'var(--color-cat-water)',
  food: 'var(--color-cat-food)',
  workout: 'var(--color-cat-workout)',
  sleep: 'var(--color-cat-sleep)',
  poop: 'var(--color-cat-poop)',
};

const PROGRESS_CATEGORIES = [
  { id: 'water', label: 'Água', icon: Droplets },
  { id: 'food', label: 'Comida', icon: Utensils },
  { id: 'workout', label: 'Treino', icon: Dumbbell },
  { id: 'sleep', label: 'Sono', icon: Moon },
  { id: 'poop', label: 'Intestino', icon: Smile },
];

const ACTION_LIST = [
  { id: 'note', label: 'Adicionar nota', icon: StickyNote, color: 'var(--color-highlight-300)', bg: 'bg-yellow-50' },
];

function PatientHomeContent({ userRole }: { userRole?: string }) {
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
  const pendingInsightData = useAppStore(state => state.pendingInsightData);
  const setPendingInsightData = useAppStore(state => state.setPendingInsightData);

  // ─── Insight Drawer state ────────────────────────────────────────────────
  const [insightData, setInsightData] = useState<AiInsight | null>(null);
  const insightChecked = useRef(false); // guard: run only once per mount

  useEffect(() => {
    // Guard: only run once per page mount to avoid re-triggering on re-renders
    if (insightChecked.current) return;
    insightChecked.current = true;

    const checkAndShowInsight = async () => {
      try {
        // ⚠️ Se o usuário já tem um drawer aberto, não interromper o fluxo
        if (useAppStore.getState().activeDrawer !== null) return;

        // 1. Fetch the latest insight
        const res = await fetch('/api/insights/latest');
        if (!res.ok) return;
        const { insight }: { insight: AiInsight | null } = await res.json();

        // Re-check after the async fetch: the user may have opened a drawer while waiting
        if (useAppStore.getState().activeDrawer !== null) return;

        if (insight && isFresh(insight.createdAt)) {
          // Case A: Fresh insight already exists
          if (insight.isViewed) {
            // Already seen → do nothing (silent)
            return;
          }
          // Not yet seen → open drawer and mark as viewed in background
          setInsightData(insight);
          setOpenDrawer('insights');
          // Fire-and-forget: mark as viewed
          fetch(`/api/insights/${insight.id}/view`, { method: 'PATCH' }).catch(() => {/* silent */});
        } else {
          // Case B: No insight or older than 4h → generate a new one in background
          const localTime = toLocalISOString(new Date());
          const genRes = await fetch('/api/insights/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ localTime }),
          });
          if (!genRes.ok) return;

          // Re-check after the slower generate call: user may have opened a drawer
          if (useAppStore.getState().activeDrawer !== null) return;

          const newInsight: AiInsight = await genRes.json();
          setInsightData(newInsight);
          setOpenDrawer('insights');
          // Fire-and-forget: mark as viewed
          fetch(`/api/insights/${newInsight.id}/view`, { method: 'PATCH' }).catch(() => {/* silent */});
        }
      } catch {
        // Silently fail — never block the home page
      }
    };

    // Delay slightly so the page renders first, then the drawer pops up
    const timer = setTimeout(checkAndShowInsight, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

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
    const startOfDay = getLocalStartOfDay();
    return activity_logs
      .filter(log => new Date(log.event_time) >= startOfDay)
      .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());
  }, [activity_logs]);

  const getProgress = useCallback((catId: string) => {
    const catLogs = todayLogs.filter(log => log.category === catId);
    if (catLogs.length === 0) return 0;

    if (catId === 'water') {
      // Sum all ml logged today, then score against the daily target
      const totalMl = catLogs.reduce((acc, log) => acc + (log.details?.quantity_ml || 0), 0);
      return calculateWaterScore(totalMl, user_profile?.targets?.water_ml_per_day || 2000);
    }

    if (catId === 'food') {
      const rawTargets = user_profile?.targets as Record<string, unknown> | undefined;
      const plannedMeals = Array.isArray(rawTargets?.planned_meals) ? rawTargets.planned_meals as string[] : [];
      return calculateFoodScore(catLogs, plannedMeals.length > 0 ? plannedMeals : 3);
    }

    // sleep, workout, poop: average of primary_value (already computed in each drawer)
    const avg = catLogs.reduce((acc, log) => acc + log.primary_value, 0) / catLogs.length;
    return Math.min(100, Math.round(avg));
  }, [todayLogs, user_profile]);

  const scores = useMemo(() => ({
    water: getProgress('water'),
    food: getProgress('food'),
    workout: getProgress('workout'),
    sleep: getProgress('sleep'),
    poop: getProgress('poop'),
  }), [getProgress]);

  const dailyScore = useMemo(() => {
    return (scores.water + scores.food + scores.workout + scores.sleep + scores.poop) / 5;
  }, [scores]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isLifesaverTime = mounted && new Date().getHours() >= 18 && dailyScore < 50;


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

  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="pb-32 pt-24 px-6 max-w-lg mx-auto space-y-6">
      <TopHeader
        leftAction="avatar"
        rightAction={isAdmin ? 'none' : 'notifications'}
        rightElement={
          isAdmin ? (
            <AdminViewSwitcher role={userRole} />
          ) : undefined
        }
      />
      {/* 1. Greeting + Streak Badge */}
      <StoryHeader />

      {/* 2. Weekly Streak Squircles */}
      <WeeklyStreak />

      {/* 3. Score Card */}
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
                if (isLimitReached) {
                  setPendingAction(null);
                  setIsWarningOpen(true);
                } else {
                  useAppStore.getState().setActiveDrawerSource('STORIES');
                  router.push(`/pillar/${cat.id}`);
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
          {/* Lifesaver Button (Conditional) */}
          {isLifesaverTime && (
            <div
              className="flex items-center bg-red-50 rounded-2xl px-4 py-4 border border-red-200 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group"
              onClick={() => setOpenDrawer('lifesaver', 'CARD')}
            >
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <LifeBuoy className="h-5 w-5 text-red-500" />
              </div>
              <span className="text-body-1 font-bold text-red-700 ml-4 flex-1">
                🆘 Como salvo meu dia?
              </span>
              <ChevronRight className="h-4 w-4 text-red-300" />
            </div>
          )}

          {/* Note */}
          {renderActionItem(ACTION_LIST[0], (
            <Drawer open={openDrawer === 'note' || undefined} onOpenChange={(o) => o ? setOpenDrawer('note', 'CARD') : setOpenDrawer(null)}>
              <DrawerTrigger asChild>
                {actionTrigger(ACTION_LIST[0])}
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
                          event_time: toLocalISOString(new Date()),
                          category: 'note',
                          primary_value: 100,
                          details: { notes: noteText },
                          source: useAppStore.getState().activeDrawerSource || 'CARD'
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

      <BottomSheet_Water
        open={openDrawer === 'water'}
        onOpenChange={(o) => !o && setOpenDrawer(null)}
      />
      <MealEqualizerDrawer
        open={openDrawer === 'meal'}
        onOpenChange={(o) => !o && setOpenDrawer(null)}
      />
      <WorkoutEqualizerDrawer
        open={openDrawer === 'workout'}
        onOpenChange={(o) => !o && setOpenDrawer(null)}
      />
      <BottomSheet_Sleep
        open={openDrawer === 'sleep'}
        onOpenChange={(o) => !o && setOpenDrawer(null)}
      />
      <BottomSheet_Poop
        open={openDrawer === 'poop'}
        onOpenChange={(o) => !o && setOpenDrawer(null)}
      />
      <JacadaDrawer
        open={openDrawer === 'jacada'}
        onOpenChange={(o) => o ? setOpenDrawer('jacada', 'CARD') : setOpenDrawer(null)}
      />
      <LifesaverDrawer
        open={openDrawer === 'lifesaver'}
        onOpenChange={(o) => o ? setOpenDrawer('lifesaver', 'CARD') : setOpenDrawer(null)}
        scores={scores}
      />
      <InsightsDrawer
        open={openDrawer === 'insights'}
        onOpenChange={(o) => {
          // Só limpa o drawer se for o insights que está ativo, para não fechar
          // um drawer que o usuário tenha aberto por conta própria
          if (!o && useAppStore.getState().activeDrawer === 'insights') {
            setOpenDrawer(null);
            setPendingInsightData(null); // limpa dados transitórios ao fechar
          }
        }}
        message={insightData?.message ?? pendingInsightData?.message ?? null}
        cta={insightData?.cta ?? pendingInsightData?.cta}
        isCtaCompleted={(() => {
          const ctaStr = (insightData?.cta ?? pendingInsightData?.cta)?.toLowerCase();
          if (!ctaStr) return false;
          const score = scores[ctaStr as keyof typeof scores] || 0;
          return (ctaStr === 'water' || ctaStr === 'food') ? score >= 100 : score > 0;
        })()}
      />

      <LimitWarningDrawer 
        isOpen={isWarningOpen} 
        onClose={() => setIsWarningOpen(false)} 
        onContinueAnyway={() => {
          if (pendingAction) {
            setOpenDrawer(pendingAction as 'water' | 'meal' | 'workout' | 'sleep' | 'poop' | 'note', 'CARD');
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
}

export function PatientHome({ userRole }: { userRole?: string }) {
  return (
    <Suspense fallback={<div className="pb-24 pt-8 px-6" />}>
      <PatientHomeContent userRole={userRole} />
    </Suspense>
  );
}
