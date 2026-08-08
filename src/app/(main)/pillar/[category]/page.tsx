/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplet, Moon, Utensils, Dumbbell, Smile, CheckCircle2, Lightbulb, Eye, Share2 } from 'lucide-react';
import { useAppStore } from '@/store/store';
import { ActivityLog } from '@/store/types';
import { getLocalStartOfDay } from '@/utils/dateUtils';
import { TopHeader } from '@/components/shared/TopHeader';
import { ShareReportDrawer } from '@/components/shared/ShareReportDrawer';
import { PhotoStickerShareDrawer } from '@/components/shared/PhotoStickerShareDrawer';
import type { InfographicPillar } from '@/components/share/ShareableInfographic';

// Aqui eu importo os drawers existentes, mas vou precisar controla-los de fora ou replicar a chamada.
// Como o Drawer do Shadcn pode ser controlado por estado global ou id, vamos passar um trigger customizado.
import { BottomSheet_Water } from '@/components/shared/BottomSheet_Water';
import { BottomSheet_Sleep } from '@/components/shared/BottomSheet_Sleep';
import { BottomSheet_Poop } from '@/components/shared/BottomSheet_Poop';
import { WorkoutEqualizerDrawer } from '@/components/shared/WorkoutEqualizerDrawer';
import { MealEqualizerDrawer } from '@/components/shared/MealEqualizerDrawer';

// Dados Educacionais Estáticos
const PILLAR_DATA: Record<string, any> = {
  water: {
    title: 'Hidratação',
    icon: Droplet,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-50',
    ctaColor: 'bg-blue-500 hover:bg-blue-600',
    ringColor: '#3b82f6',
    infoPillar: 'WATER' as InfographicPillar,
    why: ['⚡ Acelera o metabolismo', '🧠 Melhora o foco e cognição', '💧 Limpa toxinas do corpo'],
    how: ['Deixe uma garrafa na mesa', 'Beba um copo cheio ao acordar', 'Beba antes de sentir sede'],
    DrawerComponent: BottomSheet_Water,
  },
  sleep: {
    title: 'Qualidade do Sono',
    icon: Moon,
    colorClass: 'text-indigo-500',
    bgClass: 'bg-indigo-50',
    ctaColor: 'bg-indigo-500 hover:bg-indigo-600',
    ringColor: '#6366f1',
    infoPillar: 'SLEEP' as InfographicPillar,
    why: ['🔋 Restaura energia e músculos', '😌 Reduz estresse e ansiedade', '🛡️ Fortalece o sistema imune'],
    how: ['Evite telas 1h antes de deitar', 'Mantenha o quarto escuro e frio', 'Tenha horário fixo para dormir'],
    DrawerComponent: BottomSheet_Sleep,
  },
  food: {
    title: 'Alimentação',
    icon: Utensils,
    colorClass: 'text-green-500',
    bgClass: 'bg-green-50',
    ctaColor: 'bg-green-600 hover:bg-green-700',
    ringColor: '#22c55e',
    infoPillar: 'FOOD' as InfographicPillar,
    why: ['🧱 Fornece blocos de construção muscular', '🔥 Combustível para o dia', '🦠 Nutre a flora intestinal'],
    how: ['Priorize alimentos integrais', 'Coma proteína em todas refeições', 'Evite ultraprocessados'],
    DrawerComponent: MealEqualizerDrawer,
  },
  workout: {
    title: 'Treinamento',
    icon: Dumbbell,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-50',
    ctaColor: 'bg-red-500 hover:bg-red-600',
    ringColor: '#ef4444',
    infoPillar: 'TRAINING' as InfographicPillar,
    why: ['💪 Constrói massa magra', '🦴 Fortalece ossos e articulações', '❤️ Protege o coração'],
    how: ['Aqueça antes de começar', 'Priorize a execução correta', 'Descanse entre os treinos'],
    DrawerComponent: WorkoutEqualizerDrawer,
  },
  poop: {
    title: 'Saúde Intestinal',
    icon: Smile,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    ctaColor: 'bg-amber-600 hover:bg-amber-700',
    ringColor: '#d97706',
    infoPillar: 'GUT' as InfographicPillar,
    why: ['🧠 Produz 90% da serotonina', '🛡️ É a base da imunidade', '💩 Elimina o que não serve mais'],
    how: ['Coma mais fibras (frutas/veg)', 'Beba muita água', 'Movimente o corpo diariamente'],
    DrawerComponent: BottomSheet_Poop,
  }
};

// ─── Animated SVG Progress Ring ───────────────────────────────────────────────

interface ProgressRingProps {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({ percentage, color, size = 120, strokeWidth = 8 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className="drop-shadow-md"
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  );
}

export default function PillarInsightsPage() {
  const { category } = useParams();
  const catKey = category as string;
  const data = PILLAR_DATA[catKey];
  const { user_profile, activity_logs } = useAppStore();
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [infographicOpen, setInfographicOpen] = useState(false);

  const targetText = useMemo(() => {
    if (!user_profile) return '';
    if (catKey === 'water') return `Meta: ${user_profile.targets?.water_ml_per_day || 2000}ml / dia`;
    if (catKey === 'food') {
      const rawTargets = user_profile.targets as Record<string, unknown>;
      const plannedMeals = Array.isArray(rawTargets?.planned_meals) ? rawTargets.planned_meals : [];
      return `Meta: ${plannedMeals.length || 4} refs / dia`;
    }
    if (catKey === 'sleep') return `Meta: ${user_profile.targets?.sleep_hours_per_night || 8}h / noite`;
    if (catKey === 'workout') {
      const targetValue = typeof user_profile.targets?.weekly_workouts === 'object' 
        ? (user_profile.targets?.weekly_workouts as any).total || 3
        : user_profile.targets?.weekly_workouts || 3;
      return `Meta: ${targetValue} treinos / sem`;
    }
    return '1x ao dia é o ideal';
  }, [user_profile, catKey]);

  const todayLogs = useMemo(() => {
    const startOfDay = getLocalStartOfDay();
    return activity_logs.filter(
      (log) => log.category === catKey && new Date(log.event_time) >= startOfDay
    );
  }, [catKey, activity_logs]);

  const { progressPercentage, currentTotal, targetValue, unit } = useMemo(() => {
    let current = 0;
    let target = 1;
    let unitLabel = '';

    if (!user_profile) return { progressPercentage: 0, currentTotal: 0, targetValue: 1, unit: '' };

    if (catKey === 'water') {
      current = todayLogs.reduce((acc, log) => acc + (log.details?.quantity_ml || 0), 0);
      target = user_profile.targets?.water_ml_per_day || 2000;
      unitLabel = 'ml';
    } else if (catKey === 'food') {
      current = todayLogs.length;
      const rawTargets = user_profile.targets as Record<string, unknown>;
      const plannedMeals = Array.isArray(rawTargets?.planned_meals) ? rawTargets.planned_meals : [];
      target = plannedMeals.length || 4;
      unitLabel = 'ref';
    } else if (catKey === 'workout') {
      current = todayLogs.length;
      target = typeof user_profile.targets?.weekly_workouts === 'object' 
        ? (user_profile.targets?.weekly_workouts as any).total || 3
        : user_profile.targets?.weekly_workouts || 3;
      unitLabel = 'treino';
    } else if (catKey === 'sleep') {
      current = todayLogs.length;
      target = 1;
      unitLabel = 'registro';
    } else if (catKey === 'poop') {
      current = todayLogs.length;
      target = 1;
      unitLabel = 'vez';
    }

    const percentage = Math.min(100, target > 0 ? (current / target) * 100 : 0);
    return { progressPercentage: percentage, currentTotal: current, targetValue: target, unit: unitLabel };
  }, [todayLogs, user_profile, catKey]);

  const feedbackState = useMemo(() => {
    if (progressPercentage === 0) return 0; // Nenhum registro
    if (progressPercentage < 75) return 1;  // Longe da meta
    if (progressPercentage < 100) return 2; // Perto da meta
    return 3;                               // Meta Atingida
  }, [progressPercentage]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!data) return notFound();

  const Icon = data.icon;
  const DrawerComp = data.DrawerComponent;

  return (
    <div className={`min-h-screen pb-32`}>
      <TopHeader leftAction="back" />
      {/* Hero Section */}
      <div className={`${data.bgClass} pt-24 pb-16 px-6 rounded-b-[40px] relative`}>
        <div className="flex flex-col items-center justify-center mt-8 space-y-4">

          {/* Progress ring wrapping icon */}
          <div className="relative flex items-center justify-center">
            <ProgressRing
              percentage={progressPercentage}
              color={data.ringColor}
              size={120}
              strokeWidth={8}
            />
            {/* Icon centered inside the ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-white/80 shadow-sm flex items-center justify-center">
                <Icon className={`h-10 w-10 ${data.colorClass}`} />
              </div>
            </div>
          </div>

          <div className="text-center relative">
            <h1 className="text-title-1 font-bold text-neutral-800">{data.title}</h1>
            <p className="text-body-1 font-medium text-neutral-500 mt-1">{targetText}</p>

            {/* Share button — top right of the title block */}
            <button
              type="button"
              id={`btn-pillar-share-${catKey}`}
              aria-label={`Compartilhar ${data.title}`}
              onClick={() => setShareOpen(true)}
              className="absolute -right-10 top-0 p-2 rounded-full bg-white/60 hover:bg-white/90 text-neutral-500 hover:text-neutral-700 transition-all shadow-sm active:scale-95 border border-white/40"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Progress percentage label */}
          {progressPercentage > 0 && (
            <p className="text-caption-1 font-bold" style={{ color: data.ringColor }}>
              {Math.round(progressPercentage)}% da meta diária
            </p>
          )}
        </div>
      </div>

      {/* Body / Bullets */}
      <div className="px-6 py-8 space-y-6 max-w-lg mx-auto">
        
        {/* Progresso do Dia */}
        {feedbackState > 0 && (
          <div className="space-y-4">
            <Card className="bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-3xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-title-3 font-bold text-neutral-600">Evolução de Hoje</h2>
                  <span className="text-body-2 font-medium text-neutral-500">
                    {currentTotal} / {targetValue} {unit}
                  </span>
                </div>
                
                <div className="space-y-3 mt-4">
                  {todayLogs.map((log: ActivityLog) => (
                    <div key={log.id} className="flex justify-between items-center p-3 bg-white/50 rounded-2xl border border-white/60">
                      <span className="text-body-2 font-medium text-neutral-600">
                        {formatTime(log.event_time)}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-body-2 font-bold text-neutral-700">
                          {catKey === 'water' && log.details?.quantity_ml ? `${log.details.quantity_ml}ml` : '+1 registro'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-400 hover:text-brand-500 rounded-full"
                          onClick={() => setEditingLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/40">
                  {feedbackState === 1 && (
                    <p className="text-body-2 font-medium text-neutral-500">
                      Bom começo! Ainda faltam {targetValue - currentTotal} {unit} para atingir sua meta diária.
                    </p>
                  )}
                  {feedbackState === 2 && (
                    <p className="text-body-2 font-bold text-notify-warning">
                      Você está quase lá! Faltam apenas {targetValue - currentTotal} {unit}. Continue assim!
                    </p>
                  )}
                  {feedbackState === 3 && (
                    <p className="text-body-2 font-bold text-notify-success flex items-center gap-2">
                      <Smile className="w-5 h-5" />
                      Parabéns! Você atingiu sua meta diária! 🎉
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Why matters */}
        <Card className="bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-title-3 font-bold text-neutral-600">Por que importa?</h2>
            <ul className="space-y-3">
              {data.why.map((item: string, i: number) => (
                <li key={i} className="flex items-start space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-body-2 text-neutral-500 font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* How to achieve */}
        {feedbackState < 3 && (
          <Card className="bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-3xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-title-3 font-bold text-neutral-600">Como atingir a meta?</h2>
              <ul className="space-y-3">
                {data.how.map((item: string, i: number) => (
                  <li key={i} className="flex items-start space-x-3">
                    <Lightbulb className="h-6 w-6 text-orange-400 flex-shrink-0" />
                    <span className="text-body-2 text-neutral-500 font-medium leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-light via-bg-light/90 to-transparent flex justify-center z-50">
        <div className="w-full max-w-lg">
          <DrawerComp customTrigger={
            <Button 
                className={`w-full h-16 rounded-2xl text-white font-bold text-title-3 shadow-lg ${data.ctaColor}`}
            >
                Registrar {data.title}
            </Button>
          } />
        </div>
      </div>
      
      {/* Edit Drawer Instance */}
      <DrawerComp 
        initialData={editingLog || undefined}
        open={!!editingLog}
        onOpenChange={(o: boolean) => {
          if (!o) setEditingLog(null);
        }}
      />

      {/* Share Drawer */}
      <PhotoStickerShareDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        context={{ type: 'PILLAR', pillar: data.infoPillar, score: Math.round(progressPercentage) }}
        onOpenInfographic={() => { setShareOpen(false); setInfographicOpen(true); }}
      />
      <ShareReportDrawer
        open={infographicOpen}
        onOpenChange={setInfographicOpen}
        type="PILLAR"
        pillar={data.infoPillar}
      />
    </div>
  );
}
