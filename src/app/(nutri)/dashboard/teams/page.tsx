import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';

export default async function NutriTeamsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-title-2 font-bold text-neutral-600">Consultório e Times</h1>
        <p className="text-body-2 text-neutral-400 mt-1">Gerencie os times e permissões do seu consultório.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-3xl border border-neutral-100 shadow-sm mt-8">
        <Users className="h-12 w-12 text-neutral-200 mb-4" />
        <h3 className="text-title-3 font-semibold text-neutral-500">Em desenvolvimento</h3>
        <p className="text-body-2 text-neutral-400 mt-2 max-w-sm">
          A gestão completa de times estará disponível em breve.
        </p>
      </div>
    </div>
  );
}
