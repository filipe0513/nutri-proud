import { BarChart3, TrendingUp, Droplets, Utensils, Dumbbell, Moon, Smile } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'water', label: 'Água', icon: Droplets, color: 'var(--color-cat-water)', bg: 'bg-blue-50' },
  { id: 'food', label: 'Alimentação', icon: Utensils, color: 'var(--color-cat-food)', bg: 'bg-green-50' },
  { id: 'workout', label: 'Treino', icon: Dumbbell, color: 'var(--color-cat-workout)', bg: 'bg-red-50' },
  { id: 'sleep', label: 'Sono', icon: Moon, color: 'var(--color-cat-sleep)', bg: 'bg-slate-100' },
  { id: 'poop', label: 'Intestino', icon: Smile, color: 'var(--color-cat-poop)', bg: 'bg-amber-50' },
];

export default function InsightsPage() {
  return (
    <div className="pb-24 pt-8 px-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-gradient-insights flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-title-2 text-neutral-500">Insights</h1>
          <p className="text-body-2 text-neutral-400">Suas estatísticas da semana</p>
        </div>
      </div>

      {/* Weekly Overview Placeholder */}
      <div className="bg-white rounded-2xl border border-neutral-200/60 p-5 space-y-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-neutral-400" />
          <h2 className="text-body-1 font-semibold text-neutral-500">Resumo Semanal</h2>
        </div>
        <p className="text-body-2 text-neutral-400">
          Em breve você verá gráficos e tendências dos seus registros aqui.
        </p>
        <div className="h-32 rounded-xl bg-neutral-100 flex items-center justify-center">
          <p className="text-caption-1 text-neutral-300 font-medium">Gráfico em construção</p>
        </div>
      </div>

      {/* Per-category links */}
      <div className="space-y-3">
        <h2 className="text-body-2 font-semibold text-neutral-400 px-1">Por categoria</h2>
        {CATEGORIES.map((cat) => (
          <Link key={cat.id} href={`/pillar/${cat.id}`}>
            <div className="flex items-center bg-white rounded-2xl px-4 py-4 border border-neutral-200/60 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] mb-3">
              <div className={`h-10 w-10 rounded-full ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                <cat.icon className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <span className="text-body-1 font-medium text-neutral-500 ml-4 flex-1">
                {cat.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
