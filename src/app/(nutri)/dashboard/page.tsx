import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getNutriFeed } from '@/services/teamService';
import { nutritionistService } from '@/services/nutritionistService';
import { NutriFeedClient } from '@/components/shared/NutriFeedClient';

export const metadata: Metadata = {
  title: 'Feed — Dashboard Nutri',
  description: 'Acompanhe as publicacoes e conquistas dos seus pacientes.',
};

export default async function NutriDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  const [items, profile] = await Promise.all([
    getNutriFeed(session.user.id),
    nutritionistService.getOwn(session.user.id),
  ]);

  const noProfile = !profile || !profile.displayName;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-title-2 font-bold text-neutral-600">Feed</h1>
        <p className="text-body-2 text-neutral-400 mt-1">
          Acompanhe as publicacoes e conquistas dos seus pacientes.
        </p>
      </div>

      {noProfile && (
        <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4 flex items-start gap-4">
          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-2 font-semibold text-neutral-500">Crie seu perfil público</p>
            <p className="text-caption-1 text-neutral-400 mt-0.5">
              Pacientes em busca de acompanhamento poderão encontrar você pelo diretório.
            </p>
            <Link
              href="/dashboard/perfil-publico"
              className="mt-3 inline-flex items-center justify-center h-10 px-4 rounded-2xl bg-brand-500 text-white text-button-1"
            >
              Criar perfil
            </Link>
          </div>
        </div>
      )}

      <NutriFeedClient items={items} currentUserId={session.user.id} />
    </div>
  );
}
