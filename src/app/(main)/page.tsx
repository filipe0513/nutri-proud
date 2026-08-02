import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { UserRole } from '@/types/roles';
import { PatientHome } from '@/components/shared/PatientHome';
import { NutriDashboard } from '@/components/shared/NutriDashboard';

/**
 * Home page — Server Component.
 *
 * Bifurca a renderização com base na role do usuário autenticado:
 * - NUTRITIONIST → <NutriDashboard /> (painel de gestão de pacientes)
 * - USER / ADMIN / anônimo → <PatientHome /> (painel gamificado de saúde)
 */
export default async function DashboardPage() {
  const session = await auth();
  const cookieStore = await cookies();

  // Suporte a sessões reais (Auth.js) e sessões anônimas (cookie)
  const role = session?.user?.role;
  const isAnonSession = !session && !!cookieStore.get('anon_user_id')?.value;

  if (!isAnonSession && role === UserRole.NUTRITIONIST) {
    return <NutriDashboard />;
  }

  return <PatientHome />;
}
