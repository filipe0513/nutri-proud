"use client";

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Droplets, Utensils, Dumbbell, Moon, Smile, Sparkles, AlertTriangle, Trophy, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface InsightData {
  aiVerdict: string | null;
  metrics: {
    weeklyAverage: number;
    previousWeeklyAverage: number;
    strongestPillar: string | null;
    weakestPillar: string | null;
  };
}

const CATEGORY_MAP: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  water: { label: 'Água', icon: Droplets, color: 'var(--color-cat-water)', bg: 'bg-blue-50' },
  food: { label: 'Alimentação', icon: Utensils, color: 'var(--color-cat-food)', bg: 'bg-green-50' },
  workout: { label: 'Treino', icon: Dumbbell, color: 'var(--color-cat-workout)', bg: 'bg-red-50' },
  sleep: { label: 'Sono', icon: Moon, color: 'var(--color-cat-sleep)', bg: 'bg-slate-100' },
  poop: { label: 'Intestino', icon: Smile, color: 'var(--color-cat-poop)', bg: 'bg-amber-50' },
};

export default function InsightsPage() {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchInsights = async (generate = false) => {
    try {
      if (generate) setGenerating(true);
      else setLoading(true);

      const res = await fetch(`/api/insights${generate ? '?generate=true' : ''}`);
      if (!res.ok) throw new Error('Falha ao carregar os dados');
      
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInsights();
  }, []);

  const getPillarInfo = (key: string | null) => {
    if (!key || !CATEGORY_MAP[key]) return { label: 'N/A', icon: TrendingUp, color: 'currentColor' };
    return CATEGORY_MAP[key];
  };

  const renderAiBlock = () => {
    if (loading && !generating && !data) {
      return (
        <div className="bg-glass-light-2 backdrop-blur-md rounded-2xl border border-white/40 p-5 space-y-4 animate-pulse">
          <div className="h-6 w-32 bg-neutral-200 rounded-md"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-neutral-200 rounded-md"></div>
            <div className="h-4 w-5/6 bg-neutral-200 rounded-md"></div>
            <div className="h-4 w-4/6 bg-neutral-200 rounded-md"></div>
          </div>
        </div>
      );
    }

    if (generating) {
      return (
        <div className="bg-glass-light-2 backdrop-blur-md rounded-2xl border border-white/40 p-8 flex flex-col items-center justify-center space-y-4">
          <Sparkles className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-body-2 font-medium text-indigo-600 animate-pulse">A IA está analisando sua semana...</p>
        </div>
      );
    }

    if (data?.aiVerdict) {
      return (
        <div className="bg-glass-light-2 backdrop-blur-md rounded-2xl border border-white/40 p-5 space-y-3 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="h-16 w-16 text-indigo-500" />
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <h2 className="text-body-1 font-semibold text-indigo-600">Veredito da IA</h2>
          </div>
          <p className="text-body-2 text-neutral-600 leading-relaxed z-10 relative">
            {data.aiVerdict}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-glass-light-2 backdrop-blur-md rounded-2xl border border-white/40 p-6 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-indigo-500" />
        </div>
        <div>
          <h3 className="text-body-1 font-semibold text-neutral-600">Descubra como foi sua semana</h3>
          <p className="text-body-2 text-neutral-500 mt-1">A IA vai analisar seus registros e te dar um feedback personalizado.</p>
        </div>
        <button
          onClick={() => fetchInsights(true)}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center space-x-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>Gerar Veredito da Semana</span>
        </button>
      </div>
    );
  };

  const renderMathBlock = () => {
    if (!data) return null;
    
    const { metrics } = data;
    const diff = metrics.weeklyAverage - metrics.previousWeeklyAverage;
    const isPositive = diff > 0;
    const isNegative = diff < 0;

    const StrongestIcon = getPillarInfo(metrics.strongestPillar).icon;
    const WeakestIcon = getPillarInfo(metrics.weakestPillar).icon;

    return (
      <div className="grid grid-cols-2 gap-3">
        {/* Termômetro da Semana */}
        <div className="col-span-2 bg-white rounded-2xl border border-neutral-200/60 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-caption-1 font-medium text-neutral-400">Termômetro da Semana</h3>
            <div className="flex items-end space-x-2 mt-1">
              <span className="text-title-1 font-bold text-neutral-700">{metrics.weeklyAverage}</span>
              <span className="text-body-2 text-neutral-400 pb-1">/100</span>
            </div>
          </div>
          <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : isNegative ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-500'}`}>
            {isPositive ? <ArrowUp className="h-4 w-4" /> : isNegative ? <ArrowDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            <span className="text-caption-1 font-bold">{Math.abs(diff)} pts</span>
          </div>
        </div>

        {/* Destaque */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 space-y-2">
          <div className="flex items-center space-x-1">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <h3 className="text-caption-1 font-medium text-neutral-400">Destaque</h3>
          </div>
          <div className="flex items-center space-x-2">
            <StrongestIcon className="h-5 w-5" style={{ color: getPillarInfo(metrics.strongestPillar).color }} />
            <span className="text-body-1 font-semibold text-neutral-600">{getPillarInfo(metrics.strongestPillar).label}</span>
          </div>
        </div>

        {/* Alerta */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 space-y-2">
          <div className="flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="text-caption-1 font-medium text-neutral-400">Ponto de Alerta</h3>
          </div>
          <div className="flex items-center space-x-2">
            <WeakestIcon className="h-5 w-5" style={{ color: getPillarInfo(metrics.weakestPillar).color }} />
            <span className="text-body-1 font-semibold text-neutral-600">{getPillarInfo(metrics.weakestPillar).label}</span>
          </div>
        </div>
      </div>
    );
  };

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

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Bloco 1: Veredito da IA */}
      {renderAiBlock()}

      {/* Bloco 2: Grid Matemática */}
      {renderMathBlock()}

      {/* Per-category links */}
      <div className="space-y-3 pt-2">
        <h2 className="text-body-2 font-semibold text-neutral-400 px-1">Ver detalhes por categoria</h2>
        {Object.values(CATEGORY_MAP).map((cat, i) => (
          <Link key={i} href={`/pillar/${Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === cat)}`}>
            <div className="flex items-center bg-white rounded-2xl px-4 py-4 border border-neutral-200/60 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] mb-3">
              <div className={`h-10 w-10 rounded-full ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                <cat.icon className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <span className="text-body-1 font-medium text-neutral-500 ml-4 flex-1">
                {cat.label}
              </span>
              <ArrowRight className="h-4 w-4 text-neutral-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
