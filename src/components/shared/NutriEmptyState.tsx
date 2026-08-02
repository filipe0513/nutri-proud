import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function NutriEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="space-y-2 max-w-md mx-auto">
        <h1 className="text-title-1 font-bold text-neutral-600">
          Bem-vinda ao seu novo painel! 🥗
        </h1>
        <p className="text-body-1 text-neutral-500">
          Tudo começa aqui. Crie seu primeiro grupo de acompanhamento ou convide seu primeiro paciente para começarmos a medir a adesão.
        </p>
      </div>

      <button
        type="button"
        onClick={() => toast.info('Criação de grupos em breve! 🚀')}
        className="flex items-center justify-center gap-2 bg-brand-500 text-white rounded-full px-6 py-3 text-button-1 font-semibold hover:bg-brand-600 active:scale-[0.97] transition-all shadow-md"
      >
        <Plus className="h-5 w-5" />
        Criar meu primeiro grupo
      </button>
    </div>
  );
}
