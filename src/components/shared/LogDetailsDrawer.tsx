'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ActivityLog } from '@/store/types';
import type { TeamFeedPostWithPatient, EvolutionMetadata } from '@/types/teamTypes';

// ─── Types ─────────────────────────────────────────────────────────────────────

type LogDetailsDrawerProps =
  | {
      kind: 'activity';
      log: ActivityLog | null;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onEdit?: () => void;
    }
  | {
      kind: 'system';
      feedPost: TeamFeedPostWithPatient | null;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    };

// ─── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  water: '💧',
  food: '🥗',
  workout: '🏋️',
  sleep: '🌙',
  poop: '💩',
  jacada: '🍩',
  evolution: '📸',
  note: '📝',
};

const CATEGORY_NAMES: Record<string, string> = {
  water: 'Água',
  food: 'Alimentação',
  workout: 'Treino',
  sleep: 'Sono',
  poop: 'Intestino',
  jacada: 'Jacada',
  evolution: 'Evolução',
  note: 'Nota',
};

const QUALITY_CONFIG: Record<string, { label: string; cls: string }> = {
  cansado: { label: 'Cansado', cls: 'text-notify-error' },
  normal: { label: 'Normal', cls: 'text-notify-warning' },
  revigorado: { label: 'Revigorado', cls: 'text-notify-success' },
};

const MEAL_TYPE_MAP: Record<string, string> = {
  cafe_da_manha: 'Café da manhã',
  lanche_da_manha: 'Lanche da manhã',
  almoco: 'Almoço',
  lanche_da_tarde: 'Lanche da tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
};

// ─── Sub-components ─────────────────────────────────────────────────────────────

function FactorBar({ label, value }: { label: string; value: number }) {
  const pct = Math.abs(value) * 2;
  const isNeg = value < 0;
  return (
    <div>
      <div className="flex justify-between text-caption-2 text-neutral-400 mb-1">
        <span>{label}</span>
        <span className={isNeg ? 'text-notify-warning' : 'text-notify-success'}>
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <div className="relative h-2 bg-neutral-200/60 rounded-full">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-neutral-300" />
        <div
          className={`absolute top-0 bottom-0 rounded-full ${isNeg ? 'bg-notify-warning right-1/2' : 'bg-notify-success left-1/2'}`}
          style={{ width: `${pct / 2}%` }}
        />
      </div>
    </div>
  );
}

function ScoreIndicator({ label, value, max = 5, icon }: { label: string; value: number; max?: number; icon: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body-2 text-neutral-500">
        {icon} {label}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 ${
              i < value
                ? 'bg-brand-500 border-brand-500'
                : 'bg-neutral-100 border-neutral-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Category Content ───────────────────────────────────────────────────────────

function EvolutionContent({
  details,
}: {
  details: { photo_url?: string; weight_kg?: number; caption?: string } | null;
}) {
  if (!details?.photo_url) return null;
  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={details.photo_url}
        alt="Check-in de evolução"
        className="w-full rounded-2xl object-cover max-h-[400px]"
        loading="lazy"
      />
      {details.weight_kg != null && (
        <div className="flex items-center gap-2">
          <span className="text-title-2 font-bold text-neutral-600">{details.weight_kg}</span>
          <span className="text-body-2 text-neutral-400">kg</span>
        </div>
      )}
      {details.caption && (
        <p className="text-body-2 text-neutral-500 leading-relaxed">{details.caption}</p>
      )}
    </div>
  );
}

function WaterContent({ details }: { details: Record<string, unknown> | null }) {
  const ml = details?.quantity_ml as number | undefined;
  return (
    <div className="flex items-center gap-3">
      <span className="text-4xl">💧</span>
      <span className="text-title-1 font-bold text-cat-water">{ml ?? '—'}</span>
      <span className="text-body-1 text-neutral-400">ml</span>
    </div>
  );
}

function FoodContent({ details }: { details: Record<string, unknown> | null }) {
  const mealType = details?.meal_type as string | undefined;
  const factors = details?.factors as Record<string, number> | undefined;
  const note = details?.note as string | undefined;
  const mealLabel = mealType ? (MEAL_TYPE_MAP[mealType] ?? mealType) : null;

  return (
    <div className="space-y-4">
      {mealLabel && (
        <div>
          <p className="text-caption-1 text-neutral-400 mb-1">Refeição</p>
          <p className="text-body-1 font-semibold text-neutral-600">{mealLabel}</p>
        </div>
      )}
      {factors && (
        <div className="space-y-3">
          <p className="text-caption-1 text-neutral-400">Fatores nutricionais</p>
          <FactorBar label="Carboidratos" value={factors.carbs ?? 0} />
          <FactorBar label="Proteínas" value={factors.protein ?? 0} />
          <FactorBar label="Gorduras" value={factors.fats ?? 0} />
          <FactorBar label="Fibras" value={factors.fiber ?? 0} />
        </div>
      )}
      {note && (
        <div>
          <p className="text-caption-1 text-neutral-400 mb-1">Observação</p>
          <p className="text-body-2 text-neutral-500">{note}</p>
        </div>
      )}
    </div>
  );
}

function WorkoutContent({ details }: { details: Record<string, unknown> | null }) {
  const factors = details?.factors as Record<string, number> | undefined;
  return (
    <div className="space-y-3">
      {factors && (
        <>
          <FactorBar label="Cardio" value={factors.cardio ?? 0} />
          <FactorBar label="Carga" value={factors.carga ?? 0} />
        </>
      )}
    </div>
  );
}

function SleepContent({ details }: { details: Record<string, unknown> | null }) {
  const hours = details?.duration_hours as number | undefined;
  const awoke = details?.awoke_times as number | undefined;
  const quality = details?.quality_feeling as string | undefined;
  const qConfig = quality ? QUALITY_CONFIG[quality] : null;

  return (
    <div className="space-y-4">
      {hours != null && (
        <div className="flex items-center gap-2">
          <span className="text-title-1 font-bold text-cat-sleep">{hours}</span>
          <span className="text-body-1 text-neutral-400">horas</span>
        </div>
      )}
      {awoke != null && (
        <div>
          <p className="text-caption-1 text-neutral-400 mb-1">Acordou durante a noite</p>
          <p className="text-body-1 font-semibold text-neutral-600">{awoke}x</p>
        </div>
      )}
      {qConfig && (
        <div>
          <p className="text-caption-1 text-neutral-400 mb-1">Qualidade</p>
          <span className={`text-body-1 font-bold ${qConfig.cls}`}>{qConfig.label}</span>
        </div>
      )}
    </div>
  );
}

function PoopContent({ details }: { details: Record<string, unknown> | null }) {
  const state = details?.state as string | undefined;
  const nutriAnalysis = details?.nutri_analysis as string | undefined;

  return (
    <div className="space-y-4">
      {state && (
        <div>
          <p className="text-caption-1 text-neutral-400 mb-1">Estado</p>
          <p className="text-body-1 font-semibold text-neutral-600">💩 {state}</p>
        </div>
      )}
      {nutriAnalysis && (
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4">
          <p className="text-caption-1 font-semibold text-amber-700 mb-1">🧠 Análise da Nutri</p>
          <p className="text-body-2 text-amber-800">{nutriAnalysis}</p>
        </div>
      )}
    </div>
  );
}

function JacadaContent({ details }: { details: Record<string, unknown> | null }) {
  const sugar = typeof details?.sugar === 'number' ? details.sugar : 0;
  const fat = typeof details?.fat === 'number' ? details.fat : 0;
  const alcohol = typeof details?.alcohol === 'number' ? details.alcohol : 0;
  const nutriReaction = details?.nutri_reaction as string | undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <ScoreIndicator label="Açúcar" value={sugar} icon="🍬" />
        <ScoreIndicator label="Gordura" value={fat} icon="🍔" />
        <ScoreIndicator label="Álcool" value={alcohol} icon="🍺" />
      </div>
      {nutriReaction && (
        <div className="bg-orange-50/60 border border-orange-200/60 rounded-2xl p-4">
          <p className="text-caption-1 font-semibold text-orange-700 mb-1">💬 Reação da Nutri</p>
          <p className="text-body-2 text-orange-800">{nutriReaction}</p>
        </div>
      )}
    </div>
  );
}

function NoteContent({ details }: { details: Record<string, unknown> | null }) {
  const text = details?.text as string | undefined;
  return text ? (
    <p className="text-body-1 text-neutral-500 leading-relaxed">{text}</p>
  ) : null;
}

function CategoryContent({ category, details }: { category: string; details: Record<string, unknown> | null }) {
  switch (category) {
    case 'water':
      return <WaterContent details={details} />;
    case 'food':
      return <FoodContent details={details} />;
    case 'workout':
      return <WorkoutContent details={details} />;
    case 'sleep':
      return <SleepContent details={details} />;
    case 'poop':
      return <PoopContent details={details} />;
    case 'jacada':
      return <JacadaContent details={details} />;
    case 'evolution':
      return <EvolutionContent details={details as { photo_url?: string; weight_kg?: number; caption?: string } | null} />;
    case 'note':
      return <NoteContent details={details} />;
    default:
      return null;
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function LogDetailsDrawer(props: LogDetailsDrawerProps) {
  if (props.kind === 'activity') {
    const { log, open, onOpenChange, onEdit } = props;
    const details = (log?.details ?? null) as Record<string, unknown> | null;

    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white/40 rounded-t-[32px] max-w-lg mx-auto">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-title-3 font-bold text-neutral-600 text-center flex items-center justify-center gap-2">
              {log && (
                <>
                  <span>{CATEGORY_ICONS[log.category] ?? '📌'}</span>
                  <span>{CATEGORY_NAMES[log.category] ?? log.category}</span>
                </>
              )}
            </DrawerTitle>
            {log && (
              <p className="text-caption-1 text-neutral-400 text-center mt-1">
                {format(new Date(log.event_time), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </DrawerHeader>

          <div className="px-6 pb-4 space-y-4 overflow-y-auto max-h-[65vh]">
            {log && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-caption-1 text-neutral-400">Pontuação</span>
                  <span className="text-body-1 font-bold text-neutral-600">{log.primary_value}</span>
                </div>
                <CategoryContent category={log.category} details={details} />
              </>
            )}
          </div>

          {onEdit && (
            <div className="px-6 pb-8 pt-2">
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl border border-white/40 bg-glass-light-1 text-neutral-700 hover:bg-white/60 gap-2"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  // kind === 'system'
  const { feedPost, open, onOpenChange } = props;
  const meta = feedPost?.metadata as EvolutionMetadata | null;
  const patientName = feedPost?.patient.name ?? 'Paciente';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white/40 rounded-t-[32px] max-w-lg mx-auto">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="sr-only">Detalhe do post</DrawerTitle>
          {feedPost && (
            <div className="flex items-center gap-3 justify-center">
              <Avatar className="h-9 w-9">
                {feedPost.patient.image && (
                  <AvatarImage src={feedPost.patient.image} alt={patientName} referrerPolicy="no-referrer" />
                )}
                <AvatarFallback className="bg-brand-100 text-brand-500 text-sm font-bold">
                  {patientName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-body-1 font-semibold text-neutral-600">{patientName}</p>
                <p className="text-caption-1 text-neutral-400">
                  {format(new Date(feedPost.createdAt), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </DrawerHeader>

        <div className="px-6 pb-8 space-y-4 overflow-y-auto max-h-[65vh]">
          {feedPost?.type === 'EVOLUTION' && meta && (
            <EvolutionContent
              details={{
                photo_url: (meta as EvolutionMetadata).photo_url ?? undefined,
                weight_kg: (meta as EvolutionMetadata).weight_kg ?? undefined,
                caption: (meta as EvolutionMetadata).caption ?? undefined,
              }}
            />
          )}
          {feedPost?.type !== 'EVOLUTION' && feedPost && (
            <p className="text-body-1 text-neutral-500">{feedPost.content}</p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
