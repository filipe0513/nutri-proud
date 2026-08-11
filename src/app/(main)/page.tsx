import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { UserRole } from '@/types/roles';
import { PatientHome } from '@/components/shared/PatientHome';
import { getActiveForUser } from '@/services/challengeService';
import { prisma } from '@/lib/prisma';
import { shouldShowEvolutionReminder } from '@/utils/scoreUtils';

/**
 * Home page (/) — Controlador de tráfego baseado em role.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  Role           │  Destino                                   │
 * ├─────────────────│────────────────────────────────────────────┤
 * │  NUTRITIONIST   │  redirect('/dashboard') — layout limpo     │
 * │  ADMIN          │  <PatientHome> com View Switcher            │
 * │  USER / anônimo │  <PatientHome /> renderizado em /          │
 * └─────────────────┗────────────────────────────────────────────┘
 *
 * Nota: a URL / permanece para pacientes para manter compatibilidade
 * com os testes E2E (que navegam para '/' e esperam o PatientHome).
 */
export default async function RootHomePage() {
  const session = await auth();
  const cookieStore = await cookies();
  const anonUserId = cookieStore.get('anon_user_id')?.value;

  const role = session?.user?.role;
  const isAnon = !session && !!anonUserId;

  // Nutricionistas são redirecionadas para o painel dedicado
  if (!isAnon && role === UserRole.NUTRITIONIST) {
    redirect('/dashboard');
  }

  // Compute evolution reminder — server-side, pure function, no client state needed
  let showEvolutionReminder = false;
  const userId = session?.user?.id;
  if (userId && !isAnon) {
    const [activeChallenges, lastEvolutionLog] = await Promise.all([
      getActiveForUser(userId),
      prisma.dailyLog.findFirst({
        where: { userId, category: 'evolution' },
        orderBy: { eventTime: 'desc' },
        select: { eventTime: true },
      }),
    ]);
    const weeklyChallenge = activeChallenges.find((c) => c.weeklyEvolution);
    showEvolutionReminder = shouldShowEvolutionReminder(weeklyChallenge, lastEvolutionLog);
  }

  // Pacientes, ADMINs e usuários anônimos vêem o painel gamificado
  // ADMINs recebem a role para exibir o View Switcher no header
  return <PatientHome userRole={role} showEvolutionReminder={showEvolutionReminder} />;
}
