import type { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDashboardTeams, getPatientRadar, getActiveTodayCount } from '@/services/teamService';
import {
  getPatientGoalAdherence,
  getBrokenStreaks,
  getTeamWeakestPillars,
  getSocialDisengagement,
  getInactivePatients,
} from '@/services/dashboardInsightsService';
import { NutriDashboard } from '@/components/shared/NutriDashboard';
import { PatientInsightCards } from '@/components/shared/PatientInsightCards';

export const metadata: Metadata = {
  title: 'Insights dos Pacientes — Dashboard Nutri',
  description: 'Radar de pacientes, times e metricas de adesao.',
};

export default async function NutriInsightsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  const nutriId = session.user.id;

  const [
    teams,
    radar,
    activeToday,
    goalAdherence,
    brokenStreaks,
    weakestPillars,
    socialDisengagement,
    inactivePatients,
  ] = await Promise.all([
    getDashboardTeams(nutriId, session.user.role),
    getPatientRadar(nutriId),
    getActiveTodayCount(nutriId),
    getPatientGoalAdherence(nutriId),
    getBrokenStreaks(nutriId),
    getTeamWeakestPillars(nutriId),
    getSocialDisengagement(nutriId),
    getInactivePatients(nutriId),
  ]);

  return (
    <div className="pb-24 pt-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-10">
      <NutriDashboard teams={teams} radar={radar} activeToday={activeToday} />

      <section className="space-y-2">
        <h2 className="text-title-3 font-bold text-neutral-600 px-1">Analise Detalhada</h2>
        <p className="text-caption-1 text-neutral-400 px-1">
          Metricas aprofundadas sobre adesao, engajamento e atividade dos seus pacientes.
        </p>
      </section>

      <PatientInsightCards
        goalAdherence={goalAdherence}
        brokenStreaks={brokenStreaks}
        weakestPillars={weakestPillars}
        socialDisengagement={socialDisengagement}
        inactivePatients={inactivePatients}
      />
    </div>
  );
}
