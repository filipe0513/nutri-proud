import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDashboardTeams, getTeamWithMembers } from '@/services/teamService';
import { NutriTeamsClient } from './NutriTeamsClient';

export default async function NutriTeamsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  const teams = await getDashboardTeams(session.user.id, session.user.role ?? 'USER');
  const teamsWithMembers = await Promise.all(
    teams.map((t) => getTeamWithMembers(t.id, session.user.id)),
  );

  return <NutriTeamsClient initialTeams={teamsWithMembers} />;
}
