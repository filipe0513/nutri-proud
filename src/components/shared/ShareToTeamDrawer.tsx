'use client';

import { useState, useEffect } from 'react';
import { BarChart3, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useAppStore } from '@/store/store';
import { historyService } from '@/services/historyService';
import { calculateWaterScore, calculateFoodScore } from '@/utils/scoreUtils';
import { createPost, fetchMyTeams } from '@/store/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ActivityLog } from '@/store/types';
import type { TeamSummary } from '@/types/teamTypes';

const SHAREABLE_CATEGORIES = ['water', 'food', 'workout', 'sleep', 'poop'] as const;

const CATEGORY_INFO: Record<string, { emoji: string; label: string }> = {
  water: { emoji: '💧', label: 'Hidratação' },
  food: { emoji: '🍽️', label: 'Refeição' },
  workout: { emoji: '🏋️', label: 'Treino' },
  sleep: { emoji: '😴', label: 'Sono' },
  poop: { emoji: '💩', label: 'Intestino' },
};

function generateScoreContent(score: number, pillarScores: Record<string, number>, date?: string): string {
  const dateStr = date ? format(parseISO(date), "d 'de' MMMM", { locale: ptBR }) : 'hoje';
  const bestEntry = Object.entries(pillarScores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)[0];
  const bestText = bestEntry
    ? `\n${CATEGORY_INFO[bestEntry[0]]?.emoji ?? ''} Melhor pilar: ${CATEGORY_INFO[bestEntry[0]]?.label ?? bestEntry[0]} (${bestEntry[1]}/100)`
    : '';
  return `📊 Score do dia (${dateStr}): ${score}/100! 🔥${bestText}`;
}

function generateLogContent(log: ActivityLog, date?: string): string {
  const dateStr = date ? ` (${format(parseISO(date), 'd/MM')})` : '';
  switch (log.category) {
    case 'water': {
      const ml = log.details.quantity_ml ?? log.primary_value;
      return `💧 ${ml}ml de água registrados${dateStr}! Mantendo a hidratação em dia 🙌`;
    }
    case 'food': {
      const meal = log.details.meal_type ? ` (${log.details.meal_type})` : '';
      return `🍽️ Refeição${meal}${dateStr} registrada! Score: ${log.primary_value}/100`;
    }
    case 'workout':
      return `🏋️ Treino concluído${dateStr}! Score: ${log.primary_value}/100 💪`;
    case 'sleep': {
      const hours = log.details.duration_hours ?? log.primary_value;
      return `😴 ${hours}h de sono registradas${dateStr}. Score: ${log.primary_value}/100`;
    }
    case 'poop':
      return `💩 Intestino funcionando${dateStr}! Score: ${log.primary_value}/100`;
    default:
      return `Registrei no Orgulho da Nutri${dateStr}! Score: ${log.primary_value}/100`;
  }
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

interface ShareToTeamDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fills the date (YYYY-MM-DD). When absent, uses today. */
  date?: string;
  /** Pre-loaded logs for the date. When absent, uses store (today) or fetches API (past). */
  dayLogs?: ActivityLog[];
  /**
   * Mode A callbacks (teams page). When both absent, the drawer operates in
   * Mode B: fetches teams internally, creates the post, and closes itself.
   */
  onShareScore?: (score: number, pillarScores: Record<string, number>) => void;
  onShareLog?: (content: string) => void;
}

export function ShareToTeamDrawer({
  open,
  onOpenChange,
  date,
  dayLogs: dayLogsProp,
  onShareScore,
  onShareLog,
}: ShareToTeamDrawerProps) {
  const { activity_logs, user_profile } = useAppStore();
  const [step, setStep] = useState<'menu' | 'pick-log' | 'pick-team'>('menu');
  const [prevStep, setPrevStep] = useState<'menu' | 'pick-log'>('menu');

  // Mode B state
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [pendingContent, setPendingContent] = useState('');
  const [pendingMetadata, setPendingMetadata] = useState<Record<string, number> | undefined>();
  // null = loading, ActivityLog[] = loaded (reset to null on close)
  const [fetchedLogs, setFetchedLogs] = useState<ActivityLog[] | null>(null);

  const isModeB = !onShareScore && !onShareLog;

  const today = new Date().toISOString().slice(0, 10);
  const effectiveDate = date ?? today;
  const isDateToday = effectiveDate === today;

  // Determine effective logs for the selected date
  let logsForDate: ActivityLog[];
  if (dayLogsProp) {
    logsForDate = dayLogsProp;
  } else if (isDateToday) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    logsForDate = activity_logs.filter((log) => new Date(log.event_time) >= startOfDay);
  } else {
    logsForDate = fetchedLogs ?? [];
  }

  // Fetch logs when drawer opens in Mode B for a past date without pre-loaded logs.
  // No synchronous setState — loading state is derived from fetchedLogs === null.
  useEffect(() => {
    if (!open || !isModeB || dayLogsProp || isDateToday) return;
    let cancelled = false;
    fetch(`/api/logs?startDate=${effectiveDate}&endDate=${effectiveDate}&limit=50`)
      .then((r) => r.json())
      .then((data: { logs?: ActivityLog[] }) => { if (!cancelled) setFetchedLogs(data.logs ?? []); })
      .catch(() => { if (!cancelled) setFetchedLogs([]); });
    return () => { cancelled = true; };
  }, [open, isModeB, effectiveDate, dayLogsProp, isDateToday]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('menu');
      setPrevStep('menu');
      setFetchedLogs(null);
      setPendingContent('');
      setPendingMetadata(undefined);
    }
    onOpenChange(isOpen);
  };

  const computePillarScores = (logs: ActivityLog[]): Record<string, number> => {
    const targets = user_profile?.targets;
    const waterLogs = logs.filter((l) => l.category === 'water');
    const totalMl = waterLogs.reduce((acc, l) => acc + (l.details?.quantity_ml || 0), 0);
    const waterTarget = targets?.water_ml_per_day || 2000;
    const avgPrimaryScore = (cat: string) => {
      const catLogs = logs.filter((l) => l.category === cat);
      if (catLogs.length === 0) return 0;
      const avg = catLogs.reduce((acc, l) => acc + (l.primary_value ?? 0), 0) / catLogs.length;
      return Math.max(0, Math.min(100, Math.round(avg)));
    };
    return {
      water: calculateWaterScore(totalMl, waterTarget),
      food: calculateFoodScore(logs, targets?.planned_meals ?? 3),
      workout: avgPrimaryScore('workout'),
      sleep: avgPrimaryScore('sleep'),
      poop: avgPrimaryScore('poop'),
    };
  };

  const goToTeamPicker = async (from: 'menu' | 'pick-log') => {
    setPrevStep(from);
    setLoadingTeams(true);
    try {
      const data = await fetchMyTeams();
      setTeams(data);
      setStep('pick-team');
    } catch {
      toast.error('Erro ao buscar times.');
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleShareScore = () => {
    const score = historyService.calculateDayScore(logsForDate, user_profile);
    const pillarScores = computePillarScores(logsForDate);

    if (!isModeB) {
      onShareScore!(score, pillarScores);
      handleOpenChange(false);
      return;
    }

    // Mode B: generate content, then pick a team
    setPendingContent(generateScoreContent(score, pillarScores, date));
    setPendingMetadata(pillarScores);
    goToTeamPicker('menu');
  };

  const handlePickLog = (log: ActivityLog) => {
    const content = generateLogContent(log, date);
    if (!isModeB) {
      onShareLog!(content);
      handleOpenChange(false);
      return;
    }

    // Mode B: generate content, then pick a team
    setPendingContent(content);
    setPendingMetadata(undefined);
    goToTeamPicker('pick-log');
  };

  const handleTeamPick = async (teamId: string) => {
    setIsPosting(true);
    try {
      await createPost(teamId, { content: pendingContent, metadata: pendingMetadata });
      toast.success('Publicado com sucesso!', {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
      handleOpenChange(false);
    } catch {
      toast.error('Erro ao publicar no time.');
    } finally {
      setIsPosting(false);
    }
  };

  const shareableLogs = logsForDate.filter(
    (log) => (SHAREABLE_CATEGORIES as readonly string[]).includes(log.category)
  );

  const dateLabel = date ? format(parseISO(date), "d 'de' MMMM", { locale: ptBR }) : 'Hoje';

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
        <DrawerHeader className="px-0 pb-4">
          {(step === 'pick-log' || step === 'pick-team') && (
            <button
              type="button"
              onClick={() => setStep(step === 'pick-team' ? prevStep : 'menu')}
              className="absolute left-6 top-5 text-neutral-400 hover:text-neutral-500 transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <DrawerTitle className="text-title-3 text-neutral-500 text-center">
            {step === 'menu' && `Criar Postagem — ${dateLabel}`}
            {step === 'pick-log' && 'Escolha um Registro'}
            {step === 'pick-team' && 'Publicar em qual Time?'}
          </DrawerTitle>
        </DrawerHeader>

        {step === 'menu' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleShareScore}
              className="w-full flex items-center p-4 rounded-2xl bg-brand-50 border border-brand-200 hover:bg-brand-100 transition-colors text-left group"
            >
              <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <p className="text-body-1 font-semibold text-neutral-500">
                  Compartilhar Score do Dia
                </p>
                <p className="text-caption-1 text-neutral-400">
                  Publique seu progresso {date ? `de ${dateLabel}` : 'de hoje'} com a galera.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStep('pick-log')}
              className="w-full flex items-center p-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 transition-colors text-left group"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-neutral-500" />
              </div>
              <div>
                <p className="text-body-1 font-semibold text-neutral-500">
                  Compartilhar Registro
                </p>
                <p className="text-caption-1 text-neutral-400">
                  Escolha uma refeição ou treino específico.
                </p>
              </div>
            </button>
          </div>
        )}

        {step === 'pick-log' && (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(isModeB && !dayLogsProp && !isDateToday && fetchedLogs === null) ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : shareableLogs.length === 0 ? (
              <p className="text-center text-caption-1 text-neutral-400 py-8">
                Nenhum registro encontrado para {dateLabel}.
              </p>
            ) : (
              shareableLogs.map((log) => {
                const info = CATEGORY_INFO[log.category] ?? { emoji: '📝', label: log.category };
                return (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => handlePickLog(log)}
                    className="w-full flex items-center p-3 rounded-2xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 transition-colors text-left group"
                  >
                    <span className="text-2xl mr-3">{info.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-2 font-semibold text-neutral-500">{info.label}</p>
                      <p className="text-caption-2 text-neutral-400">
                        {formatTime(log.event_time)} · Score {log.primary_value}/100
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {step === 'pick-team' && (
          <div className="space-y-3">
            {loadingTeams ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : teams.length === 0 ? (
              <p className="text-center text-caption-1 text-neutral-400 py-8">
                Você não está em nenhum time.
              </p>
            ) : (
              teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  disabled={isPosting}
                  onClick={() => handleTeamPick(team.id)}
                  className="w-full flex items-center p-4 rounded-2xl bg-brand-50 border border-brand-200 hover:bg-brand-100 active:scale-[0.98] transition-all text-left disabled:opacity-60"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-white font-bold text-base">
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-2 font-semibold text-neutral-600 truncate">{team.name}</p>
                    <p className="text-caption-2 text-neutral-400">
                      {team.memberCount} membro{team.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isPosting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-brand-500 ml-2 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-brand-400 ml-2 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
