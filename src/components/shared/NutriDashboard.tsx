'use client';

import { useState } from 'react';
import {
  Users,
  AlertTriangle,
  ChevronRight,
  Link2,
  TrendingUp,
  CheckCircle2,
  MessageSquare,
  Star,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { NutriEmptyState } from './NutriEmptyState';
import { NutriMessageDrawer } from './NutriMessageDrawer';
import type { TeamSummary, PatientRadarData, PostAuthor } from '@/types/teamTypes';

// ─── Sub-components ─────────────────────────────────────────────────────────

function PatientRadar({
  radar,
  onSendMessage,
}: {
  radar: PatientRadarData;
  onSendMessage: (patient: PostAuthor) => void;
}) {
  const hasAtRisk = radar.atRisk.length > 0;
  const hasDoingGreat = radar.doingGreat.length > 0;
  const isEmpty = !hasAtRisk && !hasDoingGreat;

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <p className="text-body-2 font-semibold text-neutral-500">
          Radar de Retencao
        </p>
      </div>

      {isEmpty && (
        <div className="rounded-3xl border border-white/40 bg-glass-light-1 backdrop-blur-sm p-6 text-center">
          <p className="text-caption-1 text-neutral-400">
            Nenhum paciente categorizado ainda. Os dados aparecerao conforme seus pacientes registrarem atividades.
          </p>
        </div>
      )}

      {/* At risk */}
      {hasAtRisk && (
        <div className="rounded-3xl border border-amber-200/60 bg-amber-50/50 backdrop-blur-sm p-4 space-y-3">
          <p className="text-caption-1 font-semibold text-amber-700">
            Precisam de atencao ({radar.atRisk.length})
          </p>
          {radar.atRisk.map((item) => (
            <div key={item.patient.id} className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {item.patient.image && (
                  <AvatarImage src={item.patient.image} alt={item.patient.name ?? ''} referrerPolicy="no-referrer" />
                )}
                <AvatarFallback className="bg-amber-100 text-amber-700 text-caption-2 font-bold">
                  {(item.patient.name ?? '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-body-2 font-medium text-neutral-600 truncate">
                  {item.patient.name ?? 'Paciente'}
                </p>
                <p className="text-caption-2 text-neutral-400">
                  {item.daysSinceLastLog !== null
                    ? `${item.daysSinceLastLog} dia(s) sem registro`
                    : 'Nunca registrou'}
                  {item.recentAvgScore !== null && ` · score ${item.recentAvgScore}%`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSendMessage(item.patient)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-100 text-amber-700 text-caption-2 font-semibold hover:bg-amber-200 active:scale-[0.97] transition-all"
              >
                <MessageSquare className="h-3 w-3" />
                Mensagem
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Doing great */}
      {hasDoingGreat && (
        <div className="rounded-3xl border border-green-200/60 bg-green-50/50 backdrop-blur-sm p-4 space-y-3">
          <p className="text-caption-1 font-semibold text-green-700">
            Mandando bem ({radar.doingGreat.length})
          </p>
          {radar.doingGreat.map((item) => (
            <div key={item.patient.id} className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {item.patient.image && (
                  <AvatarImage src={item.patient.image} alt={item.patient.name ?? ''} referrerPolicy="no-referrer" />
                )}
                <AvatarFallback className="bg-green-100 text-green-700 text-caption-2 font-bold">
                  {(item.patient.name ?? '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-body-2 font-medium text-neutral-600 truncate">
                  {item.patient.name ?? 'Paciente'}
                </p>
                <p className="text-caption-2 text-neutral-400">
                  {item.teamName}
                </p>
              </div>
              {item.recentAvgScore !== null && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-caption-2 font-semibold">
                  <Star className="h-3 w-3" />
                  {item.recentAvgScore}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
  const adherenceRate = members > 0 ? Math.round((activeToday / members) * 100) : 0;
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
  radar: PatientRadarData;
  activeToday: number;
}

export function NutriDashboard({ teams, radar, activeToday }: NutriDashboardProps) {
  const [messagePatient, setMessagePatient] = useState<PostAuthor | null>(null);

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
            toast.error('Erro: Time padrao nao encontrado.');
          }
        }}
      />
    );
  }

  return (
    <div className="pb-24 pt-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6 overflow-y-auto h-full">

      {/* Welcome Header */}
      <section className="space-y-1">
        <h1 className="text-title-1 font-bold text-neutral-600">
          Meus Pacientes
        </h1>
        <p className="text-body-2 text-neutral-500">
          Acompanhe a adesao e gerencie seus times
        </p>
      </section>

      {/* Summary Stats */}
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

      {/* Radar de Retencao */}
      <PatientRadar radar={radar} onSendMessage={setMessagePatient} />

      {/* Meus Times */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-500" />
            <p className="text-body-2 font-semibold text-neutral-500">
              Meus Times
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {teams.map((group) => {
            const memberCount = group.memberCount > 1 ? group.memberCount - 1 : group.memberCount;
            return (
              <GroupCard
                key={group.id}
                name={group.name}
                members={memberCount}
                activeToday={activeToday}
                onGenerateInvite={() => handleGenerateInvite(group.inviteCode, group.name)}
              />
            );
          })}
        </div>
      </section>

      {/* Message Drawer */}
      <NutriMessageDrawer
        patient={messagePatient}
        open={!!messagePatient}
        onOpenChange={(open) => !open && setMessagePatient(null)}
      />
    </div>
  );
}
