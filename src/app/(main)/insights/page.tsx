"use client";

import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Droplets,
  Utensils,
  Dumbbell,
  Moon,
  Smile,
  Sparkles,
  AlertTriangle,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { toLocalISOString } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiInsight {
  id: string;
  message: string;
  cta: string | null;
  isViewed: boolean;
  createdAt: string;
}

interface WeeklyMetrics {
  aiVerdict: string | null;
  metrics: {
    weeklyAverage: number;
    previousWeeklyAverage: number;
    strongestPillar: string | null;
    weakestPillar: string | null;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function isFresh(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < FOUR_HOURS_MS;
}

const CATEGORY_MAP: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  water:   { label: 'Água',        icon: Droplets, color: 'var(--color-cat-water)',   bg: 'bg-blue-50'   },
  food:    { label: 'Alimentação', icon: Utensils, color: 'var(--color-cat-food)',    bg: 'bg-green-50'  },
  workout: { label: 'Treino',      icon: Dumbbell, color: 'var(--color-cat-workout)', bg: 'bg-red-50'    },
  sleep:   { label: 'Sono',        icon: Moon,     color: 'var(--color-cat-sleep)',   bg: 'bg-slate-100' },
  poop:    { label: 'Intestino',   icon: Smile,    color: 'var(--color-cat-poop)',    bg: 'bg-amber-50'  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyMetrics | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Fetch contextual insight (latest or generate if stale) ─────────────────
  useEffect(() => {
    const loadInsight = async () => {
      try {
        setInsightLoading(true);

        const res = await fetch('/api/insights/latest');
        if (!res.ok) throw new Error('Falha ao buscar insight');
        const { insight: latest }: { insight: AiInsight | null } = await res.json();

        if (latest && isFresh(latest.createdAt)) {
          // Fresh: display directly
          setInsight(latest);
          setInsightLoading(false);
        } else {
          // Stale or missing: generate a new one (loading state shown during generation)
          const localTime = toLocalISOString(new Date());
          const genRes = await fetch('/api/insights/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ localTime }),
          });
          if (!genRes.ok) throw new Error('Falha ao gerar insight');
          const fresh: AiInsight = await genRes.json();
          setInsight(fresh);
          setInsightLoading(false);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(msg);
        setInsightLoading(false);
      }
    };

    loadInsight();
  }, []);

  // ── Fetch weekly stats ─────────────────────────────────────────────────────
  useEffect(() => {
    const loadWeekly = async () => {
      try {
        setWeeklyLoading(true);
        const res = await fetch('/api/insights');
        if (!res.ok) throw new Error('Falha ao carregar estatísticas');
        const data: WeeklyMetrics = await res.json();
        setWeeklyData(data);
      } catch {
        // Weekly metrics are optional; don't block the page
      } finally {
        setWeeklyLoading(false);
      }
    };

    loadWeekly();
  }, []);

  // ── Helper ─────────────────────────────────────────────────────────────────
  const getPillarInfo = (key: string | null) => {
    if (!key || !CATEGORY_MAP[key]) return { label: 'N/A', icon: TrendingUp, color: 'currentColor' };
    return CATEGORY_MAP[key];
  };

  // ── Render: Contextual Insight block ───────────────────────────────────────
  const renderInsightBlock = () => {
    if (insightLoading) {
      return (
        <div className="bg-glass-light-2 backdrop-blur-md rounded-2xl border border-white/40 p-8 flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="relative">
            <Sparkles className="h-8 w-8 text-violet-500 animate-bounce" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-body-1 font-semibold text-violet-600 animate-pulse">Nutri está pensando em você...</p>
            <p className="text-caption-1 text-neutral-400">Gerando um insight personalizado para agora</p>
          </div>
        </div>
      );
    }

    if (insight) {
      return (
        <div className="bg-glass-light-2 backdrop-blur-md rounded-2xl border border-white/40 p-5 space-y-4 shadow-sm relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-4 -right-4 opacity-5">
            <Sparkles className="h-24 w-24 text-violet-500" />
          </div>

          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm shadow-violet-500/30 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-body-1 font-semibold text-violet-700">Insights da Nutri ✨</h2>
              <p className="text-caption-2 text-neutral-400">
                {new Date(insight.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · hoje
              </p>
            </div>
          </div>

          {/* Message */}
          <p className="text-body-2 text-neutral-600 leading-relaxed z-10 relative">
            {insight.message}
          </p>

          {/* CTA */}
          {insight.cta && CATEGORY_MAP[insight.cta.toLowerCase()] && (
            <Link
              href={`/pillar/${insight.cta.toLowerCase()}`}
              className="flex items-center justify-between bg-violet-50 border border-violet-200/60 rounded-xl px-4 py-3 hover:bg-violet-100 transition-colors group"
            >
              <div className="flex items-center space-x-2">
                {(() => {
                  const info = CATEGORY_MAP[insight.cta!.toLowerCase()];
                  const Icon = info.icon;
                  return (
                    <>
                      <Icon className="h-4 w-4" style={{ color: info.color }} />
                      <span className="text-caption-1 font-semibold text-violet-700">
                        Registrar {info.label}
                      </span>
                    </>
                  );
                })()}
              </div>
              <ArrowRight className="h-4 w-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      );
    }

    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-body-2">
        {error || 'Não foi possível carregar o insight. Tente novamente.'}
      </div>
    );
  };

  // ── Render: Weekly stats ────────────────────────────────────────────────────
  const renderMathBlock = () => {
    if (weeklyLoading) {
      return (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          <div className="col-span-2 bg-neutral-200 rounded-2xl h-20" />
          <div className="bg-neutral-200 rounded-2xl h-20" />
          <div className="bg-neutral-200 rounded-2xl h-20" />
        </div>
      );
    }

    if (!weeklyData) return null;

    const { metrics } = weeklyData;
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

  // ── Page ──────────────────────────────────────────────────────────────────
  return (
    <div className="pb-24 pt-8 px-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-insights flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-title-2 text-neutral-500">Insights</h1>
            <p className="text-body-2 text-neutral-400">Análise personalizada da Nutri</p>
          </div>
        </div>
        {/* Refresh button */}
        <button
          type="button"
          aria-label="Gerar novo insight"
          onClick={async () => {
            setInsightLoading(true);
            setError('');
            try {
              const localTime = toLocalISOString(new Date());
              const res = await fetch('/api/insights/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ localTime }),
              });
              if (!res.ok) throw new Error('Falha ao gerar');
              const fresh: AiInsight = await res.json();
              setInsight(fresh);
            } catch {
              setError('Não foi possível gerar um novo insight.');
            } finally {
              setInsightLoading(false);
            }
          }}
          className="h-9 w-9 rounded-full bg-neutral-100 hover:bg-violet-100 flex items-center justify-center transition-colors group"
        >
          <RefreshCw className="h-4 w-4 text-neutral-400 group-hover:text-violet-500 transition-colors" />
        </button>
      </div>

      {/* Bloco 1: Contextual Insight da IA */}
      {renderInsightBlock()}

      {/* Bloco 2: Estatísticas Semanais */}
      {renderMathBlock()}

      {/* Per-category links */}
      <div className="space-y-3 pt-2">
        <h2 className="text-body-2 font-semibold text-neutral-400 px-1">Ver detalhes por categoria</h2>
        {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
          <Link key={key} href={`/pillar/${key}`}>
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
