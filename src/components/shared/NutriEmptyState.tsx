import { Plus, Users, Link2 } from 'lucide-react';
import { toast } from 'sonner';

export function NutriEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-8 md:py-0 space-y-6 md:space-y-8">
      <div className="space-y-2 max-w-md mx-auto">
        <h1 className="text-title-2 md:text-title-1 font-bold text-neutral-600">
          Nenhum paciente ou time por aqui ainda 👀
        </h1>
        <p className="text-body-1 text-neutral-500">
          Você está com o painel zerado! Comece a estruturar seus acompanhamentos escolhendo uma das opções abaixo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
        {/* Card 1: Criar Time */}
        <button
          type="button"
          onClick={() => toast.info('Criação de times em breve! 🚀', {
            className: 'bg-notify-info-glass backdrop-blur-md border border-notify-info',
          })}
          className="flex flex-col items-start p-5 md:p-6 rounded-3xl border border-white/60 bg-brand-100/40 hover:bg-brand-100/60 transition-all active:scale-[0.99] group shadow-sm hover:shadow-md"
        >
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl mb-4 group-hover:bg-brand-500 group-hover:text-white transition-colors">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-title-3 font-bold text-neutral-600 mb-1">
            Criar um Time
          </h3>
          <p className="text-caption-1 text-neutral-500 mb-6">
            Ideal para segmentar seus pacientes. Ex: &quot;Desafio de Emagrecimento 30 dias&quot;, &quot;Turma de Hipertrofia&quot;.
          </p>
          <div className="mt-auto flex items-center gap-2 text-button-1 font-semibold text-brand-500 group-hover:text-brand-600">
            <Plus className="h-4 w-4" />
            Criar meu primeiro time
          </div>
        </button>

        {/* Card 2: Convidar Paciente */}
        <button
          type="button"
          onClick={() => toast.info('Convite individual em breve! 🚀', {
             className: 'bg-notify-info-glass backdrop-blur-md border border-notify-info',
          })}
          className="flex flex-col items-start p-5 md:p-6 rounded-3xl border border-white/60 bg-white/80 hover:bg-white transition-all active:scale-[0.99] group shadow-sm hover:shadow-md"
        >
          <div className="p-3 bg-neutral-100 text-neutral-600 rounded-xl mb-4 group-hover:bg-neutral-200 transition-colors">
            <Link2 className="h-6 w-6" />
          </div>
          <h3 className="text-title-3 font-bold text-neutral-600 mb-1">
            Convidar um Paciente
          </h3>
          <p className="text-caption-1 text-neutral-500 mb-6">
            Acompanhamento individualizado. Gere um link e envie diretamente para seu paciente começar a registrar.
          </p>
          <div className="mt-auto flex items-center gap-2 text-button-1 font-semibold text-neutral-600 group-hover:text-neutral-800">
            <Plus className="h-4 w-4" />
            Gerar link de convite
          </div>
        </button>
      </div>
    </div>
  );
}
