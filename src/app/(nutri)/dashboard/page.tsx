import type { Metadata } from 'next';
import { NutriDashboard } from '@/components/shared/NutriDashboard';
import { auth } from '@/auth';
import { getDashboardTeams } from '@/services/teamService';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Painel da Nutricionista',
  description: 'Gerencie seus pacientes, times e acompanhe a adesão aos hábitos de saúde.',
};

/**
 * /dashboard — Página exclusiva da Nutricionista.
 *
 * O guarda de RBAC está no layout pai (nutri)/layout.tsx.
 * Aqui buscamos os dados do banco e renderizamos o dashboard.
 *
 * Para usuários ADMIN sem nenhum time criado, getDashboardTeams
 * executa o auto-seeding de "Meu Consultório (Admin)" automaticamente,
 * garantindo que o Admin nunca veja um Empty State vazio.
 */
export default async function NutriDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  const teams = await getDashboardTeams(session.user.id, session.user.role);

  return <NutriDashboard teams={teams} />;
}

