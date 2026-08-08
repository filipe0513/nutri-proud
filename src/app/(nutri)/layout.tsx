import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { UserRole } from '@/types/roles';
import Image from 'next/image';
import Link from 'next/link';
import { AdminViewSwitcher } from '@/components/shared/AdminViewSwitcher';
import { NutriBottomNav } from '@/components/shared/NutriBottomNav';

/**
 * Layout exclusivo da Nutricionista.
 *
 * Guarda RBAC: usuários com role NUTRITIONIST **ou ADMIN** podem acessar
 * as rotas dentro do grupo (nutri). ADMINs operam em "God Mode".
 * Qualquer outro usuário é redirecionado para a home do paciente (/).
 *
 * Design: BottomNav customizado no mobile e Sidebar/Header no desktop.
 */
export default async function NutriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Não autenticado → tela de login
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  // Não é nutricionista nem admin → home do paciente
  const allowedRoles: string[] = [UserRole.NUTRITIONIST, UserRole.ADMIN];
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/');
  }

  const userName = session.user.name ?? 'Nutricionista';
  const userImage = session.user.image;

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col">
      {/* ── Top Header da Nutri ──────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <span className="text-title-3 font-bold text-neutral-600">Dashboard Nutri</span>
          </Link>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegação da nutricionista">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-body-2 font-medium text-neutral-500 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Feed
            </Link>
            <Link
              href="/dashboard/insights"
              className="px-4 py-2 text-body-2 font-medium text-neutral-500 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Insights
            </Link>
            <Link
              href="/dashboard/teams"
              className="px-4 py-2 text-body-2 font-medium text-neutral-500 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Consultório
            </Link>
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Admin View Switcher — visible only to ADMIN users */}
            <AdminViewSwitcher role={session.user.role} />

            {/* Avatar — clicável p/ configurações (igual à home) */}
            <Link
              href="/dashboard/settings"
              aria-label="Configurações"
              className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity group"
            >
              {userImage ? (
                <Image
                  src={userImage}
                  alt={userName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-500/30 group-hover:ring-brand-500/60 transition-all"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center ring-2 ring-brand-500/30 group-hover:ring-brand-500/60 transition-all">
                  <span className="text-caption-1 font-bold text-brand-500">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="hidden sm:block text-body-2 font-medium text-neutral-500 max-w-[120px] truncate">
                {userName}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Conteúdo Principal ───────────────────────────────────── */}
      <main className="flex-1 w-full pb-28 md:pb-0 overflow-y-auto">
        {children}
      </main>

      <NutriBottomNav />
    </div>
  );
}
