'use client';

import { useState } from 'react';
import { BarChart3, FileText, ChevronLeft } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useAppStore } from '@/store/store';
import { historyService } from '@/services/historyService';
import { calculateWaterScore, calculateFoodScore } from '@/utils/scoreUtils';
import type { ActivityLog } from '@/store/types';

const SHAREABLE_CATEGORIES = ['water', 'food', 'workout', 'sleep', 'poop'] as const;

const CATEGORY_INFO: Record<string, { emoji: string; label: string }> = {
  water: { emoji: '💧', label: 'Hidratação' },
  food: { emoji: '🍽️', label: 'Refeição' },
  workout: { emoji: '🏋️', label: 'Treino' },
  sleep: { emoji: '😴', label: 'Sono' },
  poop: { emoji: '💩', label: 'Intestino' },
};

function generateLogContent(log: ActivityLog): string {
  switch (log.category) {
    case 'water': {
      const ml = log.details.quantity_ml ?? log.primary_value;
      return `💧 ${ml}ml de água registrados! Mantendo a hidratação em dia 🙌`;
    }
    case 'food': {
      const meal = log.details.meal_type ? ` (${log.details.meal_type})` : '';
      return `🍽️ Refeição${meal} registrada! Score: ${log.primary_value}/100`;
    }
    case 'workout':
      return `🏋️ Treino concluído! Score: ${log.primary_value}/100 💪`;
    case 'sleep': {
      const hours = log.details.duration_hours ?? log.primary_value;
      return `😴 ${hours}h de sono registradas. Score: ${log.primary_value}/100`;
    }
    case 'poop':
      return `💩 Intestino funcionando! Score: ${log.primary_value}/100`;
    default:
      return `Registrei no Orgulho da Nutri! Score: ${log.primary_value}/100`;
  }
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

interface ShareToTeamDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareScore: (score: number, pillarScores: Record<string, number>) => void;
  onShareLog: (content: string) => void;
}

export function ShareToTeamDrawer({
  open,
  onOpenChange,
  onShareScore,
  onShareLog,
}: ShareToTeamDrawerProps) {
  const { activity_logs, user_profile } = useAppStore();
  const [step, setStep] = useState<'menu' | 'pick-log'>('menu');

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setStep('menu');
    onOpenChange(isOpen);
  };

  const handleShareScore = () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayLogs = activity_logs.filter(
      (log) => new Date(log.event_time) >= startOfDay
    );
    const score = historyService.calculateDayScore(todayLogs, user_profile);

    const targets = user_profile?.targets;

    const waterLogs = todayLogs.filter((l) => l.category === 'water');
    const totalMl = waterLogs.reduce((acc, l) => acc + (l.details?.quantity_ml || 0), 0);
    const waterTarget = targets?.water_ml_per_day || 2000;

    const avgPrimaryScore = (cat: string) => {
      const catLogs = todayLogs.filter((l) => l.category === cat);
      if (catLogs.length === 0) return 0;
      const avg = catLogs.reduce((acc, l) => acc + (l.primary_value ?? 0), 0) / catLogs.length;
      return Math.max(0, Math.min(100, Math.round(avg)));
    };

    const pillarScores: Record<string, number> = {
      water: calculateWaterScore(totalMl, waterTarget),
      food: calculateFoodScore(todayLogs, targets?.planned_meals ?? 3),
      workout: avgPrimaryScore('workout'),
      sleep: avgPrimaryScore('sleep'),
      poop: avgPrimaryScore('poop'),
    };

    onShareScore(score, pillarScores);
    handleOpenChange(false);
  };

  const handlePickLog = (log: ActivityLog) => {
    onShareLog(generateLogContent(log));
    handleOpenChange(false);
  };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayShareableLogs = activity_logs.filter(
    (log) =>
      new Date(log.event_time) >= startOfDay &&
      (SHAREABLE_CATEGORIES as readonly string[]).includes(log.category)
  );

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
        <DrawerHeader className="px-0 pb-4">
          {step === 'pick-log' && (
            <button
              type="button"
              onClick={() => setStep('menu')}
              className="absolute left-6 top-5 text-neutral-400 hover:text-neutral-500 transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <DrawerTitle className="text-title-3 text-neutral-500 text-center">
            {step === 'menu' ? 'Criar Postagem no Time' : 'Escolha um Registro'}
          </DrawerTitle>
        </DrawerHeader>

        {step === 'menu' ? (
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
                  Publique seu progresso de hoje com a galera.
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
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {todayShareableLogs.length === 0 ? (
              <p className="text-center text-caption-1 text-neutral-400 py-8">
                Nenhum registro encontrado para hoje.
              </p>
            ) : (
              todayShareableLogs.map((log) => {
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
      </DrawerContent>
    </Drawer>
  );
}
