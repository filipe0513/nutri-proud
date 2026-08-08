import type { Metadata } from 'next';
import { NutriDashboard } from '@/components/shared/NutriDashboard';
import { auth } from '@/auth';
import { getDashboardTeams, getPatientRadar, getActiveTodayCount } from '@/services/teamService';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Insights dos Pacientes — Dashboard Nutri',
  description: 'Radar de pacientes, times e metricas de adesao.',
};

export default async function NutriInsightsPage() {
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
