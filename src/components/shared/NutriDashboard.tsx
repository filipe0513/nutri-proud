'use client';

import {
  Users,
  AlertTriangle,
  ChevronRight,
  Link2,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { NutriEmptyState } from './NutriEmptyState';
import type { TeamSummary } from '@/types/teamTypes';

// ─── Sub-components ─────────────────────────────────────────────────────────

function RetentionRadar() {
  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <p className="text-body-2 font-semibold text-neutral-500">
          Radar de Retenção
        </p>
      </div>

      {/* Subtitle */}
      <p className="text-caption-1 text-neutral-500 px-1">
        Pacientes sem registro há mais de 2 dias
      </p>

      {/* Skeleton list — placeholder para a lista real */}
      <div
        className="rounded-3xl border border-white/40 bg-glass-light-1 backdrop-blur-sm p-4 space-y-3"
        aria-label="Lista de pacientes em risco (carregando)"
      >
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-neutral-200" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32 rounded-full bg-neutral-200" />
              <Skeleton className="h-2 w-20 rounded-full bg-neutral-200" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full bg-amber-200/80" />
          </div>
        ))}

        {/* Call to action pós-MVP */}
        <div className="pt-2 border-t border-neutral-200/40 flex items-center justify-center gap-1">
          <p className="text-caption-2 text-neutral-500 text-center">
            🚧 Em breve — conecte seus pacientes via Team
          </p>
        </div>
      </div>
    </section>
  );
}

interface GroupCardProps {
  name: string;
  members: number;
  activeToday: number;
  onGenerateInvite: () => void;
}

function GroupCard({ name, members, activeToday, onGenerateInvite }: GroupCardProps) {
  const adherenceRate = Math.round((activeToday / members) * 100);
  const isHealthy = adherenceRate >= 70;

  return (
    <div className="rounded-3xl border border-white/40 bg-glass-light-1 backdrop-blur-sm p-4 space-y-3 hover:shadow-md transition-all active:scale-[0.99]">
      {/* Group name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-body-1 font-semibold text-neutral-600 truncate">{name}</p>
          <p className="text-caption-1 text-neutral-500 mt-0.5">
            {members} pacientes
          </p>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-caption-2 font-semibold ${
            isHealthy
              ? 'bg-notify-success/10 text-notify-success'
              : 'bg-notify-warning/10 text-notify-warning'
          }`}
        >
          {isHealthy ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {adherenceRate}%
        </div>
      </div>

      {/* Mini stats */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-neutral-100/80 rounded-xl px-3 py-2 text-center">
          <p className="text-title-3 font-bold text-neutral-600">{activeToday}</p>
          <p className="text-caption-2 text-neutral-500">ativos hoje</p>
        </div>
        <div className="flex-1 bg-neutral-100/80 rounded-xl px-3 py-2 text-center">
          <p className="text-title-3 font-bold text-neutral-600">{members - activeToday}</p>
          <p className="text-caption-2 text-neutral-500">inativos</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onGenerateInvite}
          className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 text-white rounded-2xl px-3 py-2.5 text-button-1 font-semibold hover:bg-brand-600 active:scale-[0.97] transition-all"
        >
          <Link2 className="h-4 w-4" />
          Gerar Convite
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 bg-white/80 border border-neutral-200/60 text-neutral-600 rounded-2xl px-3 py-2.5 text-button-1 font-semibold hover:bg-white active:scale-[0.97] transition-all"
        >
          Gerenciar
          <ChevronRight className="h-4 w-4 text-neutral-500" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface NutriDashboardProps {
  teams: TeamSummary[];
}

export function NutriDashboard({ teams }: NutriDashboardProps) {
  // Apenas para simplificar no MVP, como não temos histórico hoje de pacientes ativos, activeToday é 0.
  // Em uma implementação futura seria buscado do backend.
  const activeToday = 0;

  const handleGenerateInvite = (inviteCode: string, groupName: string) => {
    const inviteLink = `${window.location.origin}/join/${inviteCode}`;

    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        toast.success(`Link de convite para "${groupName}" copiado!`, {
          description: inviteLink,
          className:
            'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
        });
      })
      .catch(() => {
        toast.info(`Link de convite: ${inviteLink}`, {
          className:
            'bg-notify-info-glass backdrop-blur-md border border-notify-info',
        });
      });
  };

  // Patient count: we only subtract the team owner when they have real patients
  // beyond themselves (memberCount > 1). When the admin is the sole member
  // (dogfooding), they ARE the patient — memberCount should not be reduced.
  const totalPatients = teams.reduce(
    (acc, t) => acc + (t.memberCount > 1 ? t.memberCount - 1 : t.memberCount),
    0,
  );
  if (totalPatients <= 0) {
    const defaultTeam = teams[0];
    return (
      <NutriEmptyState
        onGenerateInvite={() => {
          if (defaultTeam) {
            handleGenerateInvite(defaultTeam.inviteCode, defaultTeam.name);
          } else {
            toast.error('Erro: Time padrão não encontrado.');
          }
        }}
      />
    );
  }

  return (
    <div className="pb-12 pt-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">

      {/* ── Welcome Header ─────────────────────────────────────────── */}
      <section className="space-y-1">
        <h1 className="text-title-1 font-bold text-neutral-600">
          Meus Pacientes 👩‍⚕️
        </h1>
        <p className="text-body-2 text-neutral-500">
          Acompanhe a adesão e gerencie seus times
        </p>
      </section>

      {/* ── Summary Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: totalPatients, icon: Users, color: 'text-brand-500' },
          { label: 'Ativos hoje', value: activeToday, icon: CheckCircle2, color: 'text-notify-success' },
          { label: 'Times', value: teams.length, icon: TrendingUp, color: 'text-notify-warning' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/40 bg-glass-light-1 backdrop-blur-sm p-3 flex flex-col items-center gap-1"
          >
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <p className="text-title-2 font-bold text-neutral-600">{stat.value}</p>
            <p className="text-caption-2 text-neutral-500 text-center leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Radar de Retenção ──────────────────────────────────────── */}
      <RetentionRadar />

      {/* ── Meus Times ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-500" />
            <p className="text-body-2 font-semibold text-neutral-500">
              Meus Times
            </p>
          </div>
          {/* Novo time escondido para MVP focado no time padrão */}
        </div>

        <div className="space-y-3">
          {teams.map((group) => {
            const memberCount = group.memberCount > 1 ? group.memberCount - 1 : group.memberCount;
            return (
              <GroupCard
                key={group.id}
                name={group.name}
                members={memberCount}
                activeToday={activeToday} // TODO: Implementar metricas de ativos reais depois
                onGenerateInvite={() => handleGenerateInvite(group.inviteCode, group.name)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
