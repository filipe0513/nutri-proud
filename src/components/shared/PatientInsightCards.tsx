'use client';

import {
  Droplets,
  Moon,
  Flame,
  Utensils,
  Dumbbell,
  AlertTriangle,
  Clock,
  BarChart2,
  MessageSquare,
  Smartphone,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type {
  GoalAdherenceItem,
  BrokenStreakItem,
  PillarRankItem,
  DisengagedPatientItem,
  InactivePatientItem,
} from '@/services/dashboardInsightsService';

// ─── Pillar config ────────────────────────────────────────────────────────────

const PILLAR_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; colorClass: string }
> = {
  water:   { label: 'Água',      icon: Droplets, colorClass: 'text-cat-water'   },
  sleep:   { label: 'Sono',      icon: Moon,     colorClass: 'text-cat-sleep'   },
  food:    { label: 'Alimentação', icon: Utensils, colorClass: 'text-cat-food'  },
  workout: { label: 'Treino',    icon: Dumbbell,  colorClass: 'text-cat-workout' },
  poop:    { label: 'Intestino', icon: Flame,     colorClass: 'text-cat-poop'   },
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function PatientRow({
  name,
  image,
  teamName,
  badge,
}: {
  name: string | null;
  image: string | null;
  teamName: string;
  badge: React.ReactNode;
}) {
  const initials = (name ?? '?').charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9 flex-shrink-0">
        {image && <AvatarImage src={image} alt={name ?? ''} referrerPolicy="no-referrer" />}
        <AvatarFallback className="bg-neutral-200 text-neutral-600 text-caption-2 font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-body-2 font-medium text-neutral-600 truncate">
          {name ?? 'Paciente'}
        </p>
        <p className="text-caption-2 text-neutral-400 truncate">{teamName}</p>
      </div>
      {badge}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Icon className="h-4 w-4 text-neutral-400" />
      <p className="text-body-2 font-semibold text-neutral-500">{title}</p>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-white/40 bg-glass-light-1 backdrop-blur-sm p-5 text-center">
      <p className="text-caption-1 text-neutral-400">{message}</p>
    </div>
  );
}

// ─── Goal Adherence Card ──────────────────────────────────────────────────────

function AdherenceBar({ pct }: { pct: number }) {
  const color =
    pct >= 75 ? 'bg-notify-success' : pct >= 50 ? 'bg-notify-warning' : 'bg-notify-error';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span
        className={`text-caption-2 font-semibold tabular-nums ${
          pct >= 75
            ? 'text-notify-success'
            : pct >= 50
              ? 'text-notify-warning'
              : 'text-notify-error'
        }`}
      >
        {pct}%
      </span>
    </div>
  );
}

function GoalAdherenceCard({ items }: { items: GoalAdherenceItem[] }) {
  const visible = items.filter(
    (i) => i.waterAdherencePct !== null || i.sleepAdherencePct !== null,
  );

  return (
    <section className="space-y-3">
      <SectionHeader icon={BarChart2} title="Adesão às Metas" />

      {visible.length === 0 ? (
        <EmptyCard message="Pacientes sem metas definidas ainda. Configure as metas nos perfis dos pacientes." />
      ) : (
        <div className="rounded-3xl border border-white/40 bg-glass-light-1 backdrop-blur-sm p-4 space-y-4">
          {/* Column headers */}
          <div className="flex items-center gap-3">
            <div className="w-9 flex-shrink-0" />
            <div className="flex-1" />
            <div className="flex gap-3 min-w-[170px]">
              <div className="flex items-center gap-1 text-caption-2 font-semibold text-cat-water w-[80px]">
                <Droplets className="h-3 w-3" /> Água
              </div>
              <div className="flex items-center gap-1 text-caption-2 font-semibold text-cat-sleep w-[80px]">
                <Moon className="h-3 w-3" /> Sono
              </div>
            </div>
          </div>

          {visible.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <Avatar className="h-9 w-9 flex-shrink-0">
                {item.image && (
                  <AvatarImage src={item.image} alt={item.name ?? ''} referrerPolicy="no-referrer" />
                )}
                <AvatarFallback className="bg-neutral-200 text-neutral-600 text-caption-2 font-bold">
                  {(item.name ?? '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-body-2 font-medium text-neutral-600 truncate">
                  {item.name ?? 'Paciente'}
                </p>
                <p className="text-caption-2 text-neutral-400 truncate">{item.teamName}</p>
              </div>
              <div className="flex gap-3 min-w-[170px]">
                <div className="w-[80px]">
                  {item.waterAdherencePct !== null ? (
                    <AdherenceBar pct={item.waterAdherencePct} />
                  ) : (
                    <span className="text-caption-2 text-neutral-300">—</span>
                  )}
                </div>
                <div className="w-[80px]">
                  {item.sleepAdherencePct !== null ? (
                    <AdherenceBar pct={item.sleepAdherencePct} />
                  ) : (
                    <span className="text-caption-2 text-neutral-300">—</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Broken Streaks Card ──────────────────────────────────────────────────────

function BrokenStreaksCard({ items }: { items: BrokenStreakItem[] }) {
  return (
    <section className="space-y-3">
      <SectionHeader icon={AlertTriangle} title="Sequências Quebradas" />

      {items.length === 0 ? (
        <EmptyCard message="Todos os pacientes registraram atividade recentemente." />
      ) : (
        <div className="rounded-3xl border border-notify-warning/30 bg-amber-50/40 backdrop-blur-sm p-4 space-y-3">
          <p className="text-caption-1 font-semibold text-notify-warning">
            {items.length} paciente{items.length !== 1 ? 's' : ''} sem registro recente
          </p>
          {items.map((item) => (
            <PatientRow
              key={item.id}
              name={item.name}
              image={item.image}
              teamName={item.teamName}
              badge={
                <span className="flex items-center gap-1 text-caption-2 font-semibold text-notify-warning bg-amber-100/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  {item.daysSinceLastLog >= 999 ? 'Nunca' : `${item.daysSinceLastLog}d`}
                </span>
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Weakest Pillars Card ─────────────────────────────────────────────────────

function WeakestPillarsCard({ items }: { items: PillarRankItem[] }) {
  const maxCount = Math.max(...items.map((i) => i.logCount), 1);

  return (
    <section className="space-y-3">
      <SectionHeader icon={BarChart2} title="Pilares mais Fracos da Equipe" />

      <div className="rounded-3xl border border-white/40 bg-glass-light-1 backdrop-blur-sm p-4 space-y-3">
        {items.map((item) => {
          const config = PILLAR_CONFIG[item.pillar];
          if (!config) return null;
          const Icon = config.icon;
          const barPct = Math.round((item.logCount / maxCount) * 100);

          return (
            <div key={item.pillar} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                <Icon className={`h-3.5 w-3.5 ${config.colorClass}`} />
                <span className="text-caption-1 font-medium text-neutral-500">
                  {config.label}
                </span>
              </div>
              <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${config.colorClass.replace('text-', 'bg-')}`}
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <span className="text-caption-2 tabular-nums text-neutral-400 w-10 text-right">
                {item.logCount}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Social Disengagement Card ────────────────────────────────────────────────

function SocialDisengagementCard({ items }: { items: DisengagedPatientItem[] }) {
  return (
    <section className="space-y-3">
      <SectionHeader icon={MessageSquare} title="Desengajamento Social" />

      {items.length === 0 ? (
        <EmptyCard message="Todos os pacientes estão interagindo normalmente." />
      ) : (
        <div className="rounded-3xl border border-notify-warning/30 bg-amber-50/40 backdrop-blur-sm p-4 space-y-3">
          <p className="text-caption-1 font-semibold text-notify-warning">
            {items.length} paciente{items.length !== 1 ? 's' : ''} sem interação recente
          </p>
          {items.map((item) => (
            <PatientRow
              key={item.id}
              name={item.name}
              image={item.image}
              teamName={item.teamName}
              badge={
                <span className="flex items-center gap-1 text-caption-2 font-semibold text-notify-warning bg-amber-100/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  {item.daysSinceLastEngagement >= 999
                    ? 'Nunca'
                    : `${item.daysSinceLastEngagement}d`}
                </span>
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Inactive Patients Card ───────────────────────────────────────────────────

function InactivePatientsCard({ items }: { items: InactivePatientItem[] }) {
  return (
    <section className="space-y-3">
      <SectionHeader icon={Smartphone} title="Sem Acesso ao App" />

      {items.length === 0 ? (
        <EmptyCard message="Todos os pacientes acessaram o app recentemente." />
      ) : (
        <div className="rounded-3xl border border-notify-error/30 bg-red-50/40 backdrop-blur-sm p-4 space-y-3">
          <p className="text-caption-1 font-semibold text-notify-error">
            {items.length} paciente{items.length !== 1 ? 's' : ''} sem abrir o app
          </p>
          {items.map((item) => (
            <PatientRow
              key={item.id}
              name={item.name}
              image={item.image}
              teamName={item.teamName}
              badge={
                <span className="flex items-center gap-1 text-caption-2 font-semibold text-notify-error bg-red-100/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  {item.daysSinceLastSeen >= 999 ? 'Nunca' : `${item.daysSinceLastSeen}d`}
                </span>
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export interface PatientInsightCardsProps {
  goalAdherence: GoalAdherenceItem[];
  brokenStreaks: BrokenStreakItem[];
  weakestPillars: PillarRankItem[];
  socialDisengagement: DisengagedPatientItem[];
  inactivePatients: InactivePatientItem[];
}

export function PatientInsightCards({
  goalAdherence,
  brokenStreaks,
  weakestPillars,
  socialDisengagement,
  inactivePatients,
}: PatientInsightCardsProps) {
  return (
    <div className="space-y-6">
      <BrokenStreaksCard items={brokenStreaks} />
      <InactivePatientsCard items={inactivePatients} />
      <SocialDisengagementCard items={socialDisengagement} />
      <WeakestPillarsCard items={weakestPillars} />
      <GoalAdherenceCard items={goalAdherence} />
    </div>
  );
}
