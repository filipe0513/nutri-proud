import { Plus, Link2 } from 'lucide-react';

interface NutriEmptyStateProps {
  onGenerateInvite: () => void;
}

export function NutriEmptyState({ onGenerateInvite }: NutriEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-8 md:py-0 space-y-6 md:space-y-8">
      <div className="space-y-2 max-w-md mx-auto">
        <h1 className="text-title-2 md:text-title-1 font-bold text-neutral-600">
          Você ainda não tem pacientes 👀
        </h1>
        <p className="text-body-1 text-neutral-500">
          Seu painel está zerado! Gere o link de convite e envie para seu paciente começar a registrar os hábitos.
        </p>
      </div>

      <div className="flex justify-center w-full max-w-md text-left">
        {/* Card Único: Convidar Paciente */}
        <button
          type="button"
          onClick={onGenerateInvite}
          className="w-full flex flex-col items-start p-5 md:p-6 rounded-3xl border border-white/60 bg-white/80 hover:bg-white transition-all active:scale-[0.99] group shadow-sm hover:shadow-md"
        >
          <div className="flex gap-4 items-center mb-4">
            <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl group-hover:bg-brand-500 group-hover:text-white transition-colors">
              <Link2 className="h-6 w-6" />
            </div>
            <h3 className="text-title-3 font-bold text-neutral-600 mb-1">
              Convidar um Paciente
            </h3>
          </div>
          <p className="text-caption-1 text-neutral-500 mb-6 text-start">
            Acompanhamento contínuo. Gere um link e envie diretamente para seu paciente entrar no seu time.
          </p>
          <div className="mt-auto flex items-center gap-2 text-button-1 font-semibold text-brand-500 group-hover:text-brand-600">
            <Plus className="h-4 w-4" />
            Gerar link de convite
          </div>
        </button>
      </div>
    </div>
  );
}
