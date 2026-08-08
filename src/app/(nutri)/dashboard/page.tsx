import type { Metadata } from 'next';
import { NutriDashboard } from '@/components/shared/NutriDashboard';
import { auth } from '@/auth';
import { getDashboardTeams, getPatientRadar, getActiveTodayCount } from '@/services/teamService';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Painel da Nutricionista',
  description: 'Gerencie seus pacientes, times e acompanhe a adesao aos habitos de saude.',
};

export default async function NutriDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  const [teams, radar, activeToday] = await Promise.all([
    getDashboardTeams(session.user.id, session.user.role),
    getPatientRadar(session.user.id),
    getActiveTodayCount(session.user.id),
  ]);

  return <NutriDashboard teams={teams} radar={radar} activeToday={activeToday} />;
}
