import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Users, MessageSquare, BarChart3 } from 'lucide-react';

const UPCOMING_FEATURES = [
  {
    icon: Users,
    title: 'Gestao de Pacientes',
    description: 'Adicionar e remover pacientes de times, ver perfis detalhados.',
  },
  {
    icon: MessageSquare,
    title: 'Mensagens Diretas',
    description: 'Canal bidirecional de comunicacao entre nutri e paciente.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Avancados',
    description: 'Tendencias de retencao, graficos de adesao e evolucao por time.',
  },
];

export default async function NutriTeamsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-title-2 font-bold text-neutral-600">Consultorio e Times</h1>
        <p className="text-body-2 text-neutral-400 mt-1">
          Gerencie os times e permissoes do seu consultorio.
        </p>
      </div>

      <div className="space-y-4 mt-8">
        {UPCOMING_FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-white/40 bg-glass-light-1 backdrop-blur-sm p-5 flex items-start gap-4 opacity-70"
          >
            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
              <feature.icon className="h-5 w-5 text-neutral-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-body-1 font-semibold text-neutral-500">
                  {feature.title}
                </p>
                <span className="text-caption-2 font-semibold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full">
                  Em breve
                </span>
              </div>
              <p className="text-body-2 text-neutral-400 mt-1">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
