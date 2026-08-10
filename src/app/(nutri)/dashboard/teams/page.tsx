import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDashboardTeams, getTeamWithMembers } from '@/services/teamService';
import { TeamManagementClient } from './TeamManagementClient';

export default async function NutriTeamsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  const teams = await getDashboardTeams(session.user.id, session.user.role ?? 'USER');
  const teamsWithMembers = await Promise.all(
    teams.map((t) => getTeamWithMembers(t.id, session.user.id)),
  );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-title-2 font-bold text-neutral-600">Consultório e Times</h1>
        <p className="text-body-2 text-neutral-400 mt-1">
          Gerencie os times e membros do seu consultório.
        </p>
      </div>

      {teamsWithMembers.length === 0 ? (
        <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-3xl p-8 text-center">
          <p className="text-body-1 text-neutral-500 font-semibold">Nenhum time encontrado.</p>
          <p className="text-body-2 text-neutral-400 mt-1">
            Crie um time para começar a convidar pacientes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {teamsWithMembers.map((team) => (
            <TeamManagementClient key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
