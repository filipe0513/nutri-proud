'use client';

import { useState } from 'react';
import {
  Users,
  AlertTriangle,
  ChevronRight,
  Link2,
  Plus,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ─── Mock data para o skeleton inicial ─────────────────────────────────────

const MOCK_GROUPS = [
  { id: '1', name: 'Grupo Detox Verão', members: 8, activeToday: 5 },
  { id: '2', name: 'Emagrecimento Turma A', members: 12, activeToday: 9 },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function RetentionRadar() {
  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <p className="text-body-2 font-semibold text-neutral-400">
          Radar de Retenção
        </p>
      </div>

      {/* Subtitle */}
      <p className="text-caption-1 text-neutral-300 px-1">
        Pacientes sem registro há mais de 2 dias
      </p>

      {/* Skeleton list — placeholder para a lista real */}
      <div
        className="rounded-3xl border border-white/40 bg-glass-light-1 backdrop-blur-sm p-4 space-y-3"
        aria-label="Lista de pacientes em risco (carregando)"
      >
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-neutral-200/60" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32 rounded-full bg-neutral-200/60" />
              <Skeleton className="h-2 w-20 rounded-full bg-neutral-200/40" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full bg-amber-100/80" />
          </div>
        ))}

        {/* Call to action pós-MVP */}
        <div className="pt-2 border-t border-neutral-200/40 flex items-center justify-center gap-1">
          <p className="text-caption-2 text-neutral-300 text-center">
            🚧 Em breve — conecte seus pacientes via Squad
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
          <p className="text-body-1 font-semibold text-neutral-500 truncate">{name}</p>
          <p className="text-caption-1 text-neutral-300 mt-0.5">
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
          <p className="text-title-3 font-bold text-neutral-500">{activeToday}</p>
          <p className="text-caption-2 text-neutral-300">ativos hoje</p>
        </div>
        <div className="flex-1 bg-neutral-100/80 rounded-xl px-3 py-2 text-center">
          <p className="text-title-3 font-bold text-neutral-500">{members - activeToday}</p>
          <p className="text-caption-2 text-neutral-300">inativos</p>
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
          className="flex items-center justify-center gap-1.5 bg-white/80 border border-neutral-200/60 text-neutral-500 rounded-2xl px-3 py-2.5 text-button-1 font-semibold hover:bg-white active:scale-[0.97] transition-all"
        >
          Gerenciar
          <ChevronRight className="h-4 w-4 text-neutral-300" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function NutriDashboard() {
  const [groups] = useState(MOCK_GROUPS);

  const handleGenerateInvite = (groupName: string) => {
    // Mock: gera um link de convite fictício e copia para o clipboard
    const mockCode = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
    const mockLink = `${window.location.origin}/join/${mockCode}`;

    navigator.clipboard
      .writeText(mockLink)
      .then(() => {
        toast.success(`Link de convite para "${groupName}" copiado!`, {
          description: mockLink,
          className:
            'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
        });
      })
      .catch(() => {
        toast.info(`Link de convite: ${mockLink}`, {
          className:
            'bg-notify-info-glass backdrop-blur-md border border-notify-info',
        });
      });
  };

  return (
    <div className="pb-12 pt-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">

      {/* ── Welcome Header ─────────────────────────────────────────── */}
      <section className="space-y-1">
        <h1 className="text-title-1 font-bold text-neutral-500">
          Meus Pacientes 👩‍⚕️
        </h1>
        <p className="text-body-2 text-neutral-300">
          Acompanhe a adesão e gerencie seus grupos
        </p>
      </section>

      {/* ── Summary Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: groups.reduce((a, g) => a + g.members, 0), icon: Users, color: 'text-brand-500' },
          { label: 'Ativos hoje', value: groups.reduce((a, g) => a + g.activeToday, 0), icon: CheckCircle2, color: 'text-notify-success' },
          { label: 'Grupos', value: groups.length, icon: TrendingUp, color: 'text-notify-warning' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/40 bg-glass-light-1 backdrop-blur-sm p-3 flex flex-col items-center gap-1"
          >
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <p className="text-title-2 font-bold text-neutral-500">{stat.value}</p>
            <p className="text-caption-2 text-neutral-300 text-center leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Radar de Retenção ──────────────────────────────────────── */}
      <RetentionRadar />

      {/* ── Meus Grupos ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-400" />
            <p className="text-body-2 font-semibold text-neutral-400">
              Meus Grupos
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 text-brand-500 text-caption-1 font-semibold hover:underline"
            onClick={() =>
              toast.info('Criação de grupos em breve! 🚀', {
                className: 'bg-notify-info-glass backdrop-blur-md border border-notify-info',
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Novo grupo
          </button>
        </div>

        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              name={group.name}
              members={group.members}
              activeToday={group.activeToday}
              onGenerateInvite={() => handleGenerateInvite(group.name)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
