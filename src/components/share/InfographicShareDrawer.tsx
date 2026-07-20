'use client';

import { calculateWaterScore } from '@/utils/scoreUtils';

import { useState, useRef, useCallback } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { toBlob } from 'html-to-image';
import {
  Share2,
  Loader2,
  Download,
  ImageIcon,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ShareableInfographic,
  type InfographicPillar,
  type PillarScores,
} from '@/components/share/ShareableInfographic';
import { useAppStore } from '@/store/store';
import { historyService } from '@/services/historyService';
import type { ActivityLog } from '@/store/types';

// ─── Types ──────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month';

interface InfographicShareDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayLocal(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const today = getTodayLocal();

  if (period === 'today') return { startDate: today, endDate: today };

  if (period === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const start = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    return { startDate: start, endDate: today };
  }

  // month — last 30 days
  const d = new Date();
  d.setDate(d.getDate() - 29);
  const start = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  return { startDate: start, endDate: today };
}

const PERIOD_OPTIONS: { id: Period; label: string; icon: string }[] = [
  { id: 'today', label: 'Hoje', icon: '📅' },
  { id: 'week', label: '7 dias', icon: '📆' },
  { id: 'month', label: '30 dias', icon: '🗓️' },
];

const PILLAR_CATEGORIES: Record<InfographicPillar, string> = {
  WATER: 'water',
  FOOD: 'food',
  TRAINING: 'workout',
  SLEEP: 'sleep',
  GUT: 'poop',
};

/** Computes per-pillar scores and picks the best pillar from a flat log list */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeScores(logs: any[], userProfile: any): { scores: PillarScores; globalScore: number; bestPillar: InfographicPillar } {
  const pillars: InfographicPillar[] = ['WATER', 'FOOD', 'TRAINING', 'SLEEP', 'GUT'];

  const scores: PillarScores = { WATER: 0, FOOD: 0, TRAINING: 0, SLEEP: 0, GUT: 0 };

  for (const pillar of pillars) {
    const catId = PILLAR_CATEGORIES[pillar];
    const catLogs = logs.filter((l) => l.category?.toLowerCase() === catId);

    if (pillar === 'WATER') {
      const totalMl = catLogs.reduce((acc: number, l: ActivityLog) => acc + (l.details?.quantity_ml ?? 0), 0);
      const target = userProfile?.targets?.water_ml_per_day ?? 2000;
      scores[pillar] = calculateWaterScore(totalMl, target);
    } else if (pillar === 'FOOD') {
      scores[pillar] = historyService.calculateFoodScore(logs, userProfile?.targets);
    } else {
      if (catLogs.length === 0) {
        scores[pillar] = 0;
      } else {
        const avg =
          catLogs.reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (acc: number, l: any) => acc + (l.primaryValue ?? l.primary_value ?? 0),
            0,
          ) / catLogs.length;
        scores[pillar] = Math.max(0, Math.min(100, Math.round(avg)));
      }
    }
  }

  const globalScore = historyService.calculateDayScore(logs, userProfile);
  const bestPillar = pillars.reduce((best, p) =>
    scores[p] > scores[best] ? p : best,
    'WATER' as InfographicPillar,
  );

  return { scores, globalScore, bestPillar };
}

function buildPeriodName(period: Period, startDate: string, endDate: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  };
  if (period === 'today') return 'Hoje';
  if (period === 'week') return `Semana de ${fmt(startDate)} a ${fmt(endDate)}`;
  return `Mês de ${fmt(startDate)} a ${fmt(endDate)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InfographicShareDrawer({ open, onOpenChange }: InfographicShareDrawerProps) {
  const { user_profile } = useAppStore();

  const [period, setPeriod] = useState<Period>('week');
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [ready, setReady] = useState(false);

  // Computed infographic data
  const [infographicData, setInfographicData] = useState<{
    scores: PillarScores;
    globalScore: number;
    bestPillar: InfographicPillar;
    periodName: string;
  } | null>(null);

  const nodeRef = useRef<HTMLDivElement>(null);

  // ─── Fetch & Compute ─────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setReady(false);
    setInfographicData(null);
    try {
      const { startDate, endDate } = getDateRange(period);

      // Fetch ALL logs for the period (no pagination limit)
      const params = new URLSearchParams({ startDate, endDate, limit: '200', page: '1' });
      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao buscar registros');

      const data: { logs: ActivityLog[] } = await res.json();
      const logs = data.logs ?? [];

      const { scores, globalScore, bestPillar } = computeScores(logs, user_profile);
      const periodName = buildPeriodName(period, startDate, endDate);

      setInfographicData({ scores, globalScore, bestPillar, periodName });
      setReady(true);
    } catch {
      toast.error('Não foi possível gerar o infográfico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [period, user_profile]);

  // ─── Capture & Share ────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    if (!nodeRef.current) return;

    setCapturing(true);
    try {
      const blob = await toBlob(nodeRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        // Ensure we render the full 375×667 regardless of host page scroll
        width: 375,
        height: 667,
      });

      if (!blob) throw new Error('Falha ao gerar imagem');

      const file = new File([blob], 'orgulho-da-nutri.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Meu Orgulho da Nutri',
          text: 'Olha como foi meu foco no Orgulho da Nutri! 💪',
        });
      } else {
        // Fallback: download the PNG
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'orgulho-da-nutri.png';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Imagem salva!', {
          description: 'O infográfico foi baixado para o seu dispositivo.',
        });
      }
    } catch (err) {
      // User likely cancelled — only toast if it's a real error
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      if (!isAbort) {
        toast.error('Não foi possível compartilhar. Tente salvar a imagem.');
      }
    } finally {
      setCapturing(false);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!nodeRef.current) return;
    setCapturing(true);
    try {
      const blob = await toBlob(nodeRef.current, { cacheBust: true, pixelRatio: 2, width: 375, height: 667 });
      if (!blob) throw new Error('Falha ao gerar imagem');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orgulho-da-nutri.png';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Imagem salva!', {
        description: 'O infográfico foi baixado com sucesso.',
      });
    } catch {
      toast.error('Não foi possível salvar a imagem.');
    } finally {
      setCapturing(false);
    }
  }, []);

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setTimeout(() => {
        setReady(false);
        setInfographicData(null);
        setPeriod('week');
      }, 300);
    }
    onOpenChange(v);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="!bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 text-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.6)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-title-2 text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-400" />
            Compartilhar Conquistas
          </DrawerTitle>
          <p className="text-body-2 text-white/60 mt-1">
            Gere um card no estilo Stories para compartilhar seu progresso.
          </p>
        </DrawerHeader>

        <div className="flex flex-col space-y-5 mt-2">
          {/* Period selector */}
          <div className="space-y-2">
            <p className="text-caption-1 font-semibold text-white/50 uppercase tracking-wide">
              Período
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setPeriod(opt.id);
                    setReady(false);
                    setInfographicData(null);
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center h-16 rounded-2xl border text-sm font-medium transition-all',
                    period === opt.id
                      ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10',
                  )}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-caption-2 mt-0.5">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview card (visible when ready) */}
          {ready && infographicData && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-caption-1 font-semibold text-white/50 uppercase tracking-wide self-start">
                Pré-visualização
              </p>

              {/* Scaled preview — the real node at 375×667 is rendered off-screen */}
              <div
                style={{
                  width: '200px',
                  height: '355px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  transform: 'scale(1)',
                  border: '2px solid rgba(255,255,255,0.15)',
                }}
              >
                <ShareableInfographic
                  periodName={infographicData.periodName}
                  scores={infographicData.scores}
                  globalScore={infographicData.globalScore}
                  bestPillar={infographicData.bestPillar}
                />
              </div>
            </div>
          )}

          {/* Generate button */}
          {!ready && (
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-button-1 shadow-md flex items-center justify-center gap-2 w-full"
              id="btn-generate-infographic"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  Gerar Infográfico
                </>
              )}
            </Button>
          )}

          {/* Share / Download actions */}
          {ready && infographicData && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={capturing}
                className="flex-1 h-12 rounded-2xl border border-white/15 bg-white/5 text-white hover:bg-white/10 text-button-1 flex items-center justify-center gap-2"
                id="btn-download-infographic"
              >
                {capturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Salvar
              </Button>
              <Button
                onClick={handleShare}
                disabled={capturing}
                className="flex-1 h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-button-1 flex items-center justify-center gap-2 shadow-md"
                id="btn-share-infographic"
              >
                {capturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                Compartilhar
              </Button>
            </div>
          )}

          {/* Regenerate link */}
          {ready && (
            <button
              type="button"
              onClick={() => {
                setReady(false);
                setInfographicData(null);
              }}
              className="w-full text-caption-1 text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
            >
              Alterar período
            </button>
          )}
        </div>
      </DrawerContent>

      {/* ─── Off-screen render node (captured by html-to-image) ─── */}
      {infographicData && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <ShareableInfographic
            ref={nodeRef}
            periodName={infographicData.periodName}
            scores={infographicData.scores}
            globalScore={infographicData.globalScore}
            bestPillar={infographicData.bestPillar}
          />
        </div>
      )}
    </Drawer>
  );
}
