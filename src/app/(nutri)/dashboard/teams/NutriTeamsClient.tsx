'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import type { TeamWithMembers } from '@/types/teamTypes';
import { TeamManagementClient } from './TeamManagementClient';
import { CreateChallengeDrawer } from '@/components/shared/CreateChallengeDrawer';

interface NutriTeamsClientProps {
  initialTeams: TeamWithMembers[];
}

export function NutriTeamsClient({ initialTeams }: NutriTeamsClientProps) {
  const [challengeDrawerOpen, setChallengeDrawerOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-title-2 font-bold text-neutral-600">Consultório e Times</h1>
          <p className="text-body-2 text-neutral-400 mt-1">
            Gerencie os times e membros do seu consultório.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setChallengeDrawerOpen(true)}
          className="shrink-0 flex items-center gap-2 h-10 px-4 rounded-2xl bg-brand-500 text-white text-button-1 font-semibold transition-transform active:scale-[0.97]"
        >
          <Trophy className="h-4 w-4" />
          Desafio
        </button>
      </div>

      {initialTeams.length === 0 ? (
        <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-3xl p-8 text-center">
          <p className="text-body-1 text-neutral-500 font-semibold">Nenhum time encontrado.</p>
          <p className="text-body-2 text-neutral-400 mt-1">
            Crie um desafio para começar a convidar pacientes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {initialTeams.map((team) => (
            <TeamManagementClient key={team.id} team={team} />
          ))}
        </div>
      )}

      <CreateChallengeDrawer
        open={challengeDrawerOpen}
        onOpenChange={setChallengeDrawerOpen}
      />
    </div>
  );
}
