import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getNutriFeed } from '@/services/teamService';
import { NutriFeedClient } from '@/components/shared/NutriFeedClient';

export default async function NutriFeedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  const items = await getNutriFeed(session.user.id);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-title-2 font-bold text-neutral-600">Alertas e Feed</h1>
        <p className="text-body-2 text-neutral-400 mt-1">
          Acompanhe os alertas e conquistas dos seus pacientes em tempo real.
        </p>
      </div>

      <NutriFeedClient items={items} currentUserId={session.user.id} />
    </div>
  );
}
