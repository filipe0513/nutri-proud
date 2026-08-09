/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner'
import {
  CalendarRange,
  Copy,
  Share2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { historyService } from '@/services/historyService';
import { useAppStore } from '@/store/store';

// ─── Shared types ─────────────────────────────────────────────────────────────

type ReportPeriod = 'today' | 'week' | 'month' | 'custom';
export type ShareContextType = 'DAILY_SCORE' | 'PILLAR' | 'STREAK';

interface ShareReportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ISO date YYYY-MM-DD to pre-pin the period (defaults to today) */
  date?: string;
  /** @deprecated — kept for API compatibility, ignored */
  pillar?: string;
  /** Contextual mode that adjusts the title */
  type?: ShareContextType;
  /** ISO date YYYY-MM-DD — início da semana a pré-selecionar (Weekly Streak) */
  weekStart?: string;
  /** ISO date YYYY-MM-DD — fim da semana a pré-selecionar (Weekly Streak) */
  weekEnd?: string;
  /** @deprecated — kept for API compatibility, ignored */
  nutriOnly?: boolean;
  /** If provided, renders a back chevron in the header that calls this */
  onBack?: () => void;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getTodayLocal(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function getReportDateRange(
  period: ReportPeriod,
  customStart: string,
  customEnd: string,
): { startDate: string; endDate: string } {
  const today = getTodayLocal();
  if (period === 'today') return { startDate: today, endDate: today };
  if (period === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const start = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return { startDate: start, endDate: today };
  }
  if (period === 'month') {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    const start = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return { startDate: start, endDate: today };
  }
  return { startDate: customStart || today, endDate: customEnd || today };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const REPORT_PERIOD_OPTIONS: { id: ReportPeriod; label: string; icon: string }[] = [
  { id: 'today', label: 'Hoje', icon: '📅' },
  { id: 'week', label: 'Semana', icon: '📆' },
  { id: 'month', label: 'Mês', icon: '🗓️' },
  { id: 'custom', label: 'Período', icon: '📌' },
];

// ─── Context title map ────────────────────────────────────────────────────────

const CONTEXT_TITLE: Record<ShareContextType, string> = {
  DAILY_SCORE: 'Compartilhar Dia',
  PILLAR: 'Compartilhar Pilar',
  STREAK: 'Compartilhar Conquista',
};

// ─── Main component ───────────────────────────────────────────────────────────

export function ShareReportDrawer({ open, onOpenChange, date, type, weekStart, weekEnd, onBack }: ShareReportDrawerProps) {
  // Suppress unused warning — kept for API compatibility
  void historyService;
  void useAppStore;

  // ── Report (Nutri) state ──
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);

  const today = getTodayLocal();

  // ── Sync context props when drawer opens ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    // When a specific date is passed → use 'today' period (single day)
    if (date && date !== getTodayLocal()) {
      setReportPeriod('today');
    }
    // When a weekly range is passed → pre-select custom with those dates
    if (weekStart && weekEnd) {
      setReportPeriod('custom');
      setCustomStart(weekStart);
      setCustomEnd(weekEnd);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Report handlers ──────────────────────────────────────────────────────

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportText(null);
    try {
      const { startDate, endDate } = getReportDateRange(reportPeriod, customStart, customEnd);
      const res = await fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error('Falha na requisição');
      const data: { text: string } = await res.json();
      setReportText(data.text);
    } catch {
      toast.error('Não foi possível gerar o relatório. Tente novamente.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      toast.success('Texto copiado!', {
        className:
          'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
    } catch {
      toast.error('Não foi possível copiar o texto.');
    }
  };

  const handleNativeShareText = async () => {
    if (!reportText) return;
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({ title: 'Meu Relatório de Saúde', text: reportText });
    } catch {
      // User cancelled
    }
  };

  // ── Reset on close ────────────────────────────────────────────────────────

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setTimeout(() => {
        setReportText(null);
        setReportPeriod('today');
        setCustomStart('');
        setCustomEnd('');
      }, 300);
    }
    onOpenChange(v);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="!bg-purple-50/95 backdrop-blur-2xl border-t border-purple-200 text-purple-950 shadow-[0_-15px_60px_-10px_rgba(88,28,135,0.15)] rounded-t-[32px] px-6 pb-6 max-h-[85vh] flex flex-col">
        <DrawerHeader className="px-0 shrink-0">
          <DrawerTitle className="text-title-2 text-purple-950 flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Voltar"
                className="p-1 -ml-1 rounded-full hover:bg-purple-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-purple-500" />
              </button>
            )}
            <Sparkles className="h-5 w-5 text-purple-500" />
            {type ? CONTEXT_TITLE[type] : 'Compartilhar'}
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto flex-1 pb-4">
          <div className="flex flex-col space-y-6">
            <p className="text-body-2 text-purple-900/70">
              Gere um resumo do seu desempenho e compartilhe com sua nutricionista.
            </p>

            {/* Period selector */}
            <div className="space-y-3">
              <p className="text-caption-1 font-semibold text-purple-700 uppercase tracking-wide">
                Selecionar período
              </p>
              <div className="grid grid-cols-4 gap-2">
                {REPORT_PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setReportPeriod(opt.id);
                      setReportText(null);
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center h-16 rounded-2xl border text-sm font-medium transition-all',
                      reportPeriod === opt.id
                        ? 'bg-purple-500 border-purple-500 text-white shadow-md scale-[1.02]'
                        : 'bg-white/60 border-purple-200 text-purple-800 hover:bg-purple-100/60',
                    )}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-caption-2 mt-0.5">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom date range */}
            {reportPeriod === 'custom' && (
              <div className="space-y-3">
                <p className="text-caption-1 font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarRange className="h-3.5 w-3.5" />
                  Intervalo de datas
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-caption-2 text-purple-700 font-medium">De</label>
                    <input
                      type="date"
                      max={today}
                      value={customStart}
                      onChange={(e) => { setCustomStart(e.target.value); setReportText(null); }}
                      className="h-11 rounded-xl border border-purple-200 bg-white/60 px-3 text-input-1 text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-caption-2 text-purple-700 font-medium">Até</label>
                    <input
                      type="date"
                      min={customStart || undefined}
                      max={today}
                      value={customEnd}
                      onChange={(e) => { setCustomEnd(e.target.value); setReportText(null); }}
                      className="h-11 rounded-xl border border-purple-200 bg-white/60 px-3 text-input-1 text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Generate button */}
            {!reportText && (
              <Button
                onClick={handleGenerateReport}
                disabled={reportLoading || (reportPeriod === 'custom' && (!customStart || !customEnd))}
                className="h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-button-1 shadow-md flex items-center justify-center gap-2 w-full"
                id="btn-generate-report"
              >
                {reportLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Gerando...</>
                ) : (
                  <><ChevronRight className="h-4 w-4" />Gerar Relatório</>
                )}
              </Button>
            )}

            {/* Report output */}
            {reportText && (
              <div className="space-y-4">
                <div className="bg-white/70 border border-purple-200 rounded-2xl p-4 max-h-56 overflow-y-auto no-scrollbar">
                  <pre className="text-caption-1 text-purple-900 whitespace-pre-wrap font-sans leading-relaxed">
                    {reportText}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="flex-1 h-12 rounded-2xl border border-purple-300 bg-white/60 text-purple-800 hover:bg-purple-100 text-button-1 flex items-center justify-center gap-2"
                    id="btn-copy-report"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar
                  </Button>
                  <Button
                    onClick={handleNativeShareText}
                    className="flex-1 h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-button-1 flex items-center justify-center gap-2 shadow-md"
                    id="btn-share-report"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setReportText(null)}
                  className="w-full text-caption-1 text-purple-500 hover:text-purple-700 underline underline-offset-2 transition-colors"
                >
                  Gerar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
