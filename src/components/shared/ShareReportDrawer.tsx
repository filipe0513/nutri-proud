'use client';

import { useState } from 'react';
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
  Sparkles,
  ImageIcon,
  Download,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toBlob } from 'html-to-image';
import { useRef, useCallback } from 'react';
import {
  ShareableInfographic,
  type InfographicPillar,
  type PillarScores,
} from '@/components/share/ShareableInfographic';
import { ShareableSticker } from '@/components/share/ShareableSticker';
import { calculateWaterScore } from '@/utils/scoreUtils';
import { historyService } from '@/services/historyService';
import { useAppStore } from '@/store/store';
import type { ActivityLog } from '@/store/types';
import { SquadPickerModal } from '@/components/shared/SquadPickerModal';
import { publishCardToSquad } from '@/app/actions/publishCardToSquad';

// ─── Shared types ─────────────────────────────────────────────────────────────

type ReportPeriod = 'today' | 'week' | 'month' | 'custom';
type InfographicPeriod = 'today' | 'week' | 'month';
type Tab = 'nutri' | 'infographic';

interface ShareReportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function getInfographicDateRange(period: InfographicPeriod): { startDate: string; endDate: string } {
  const today = getTodayLocal();
  if (period === 'today') return { startDate: today, endDate: today };
  if (period === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const start = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return { startDate: start, endDate: today };
  }
  const d = new Date();
  d.setDate(d.getDate() - 29);
  const start = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return { startDate: start, endDate: today };
}

// ─── Infographic computation ──────────────────────────────────────────────────

const PILLAR_CAT_MAP: Record<InfographicPillar, string> = {
  WATER: 'water',
  FOOD: 'food',
  TRAINING: 'workout',
  SLEEP: 'sleep',
  GUT: 'poop',
};

const ALL_PILLARS: InfographicPillar[] = ['WATER', 'FOOD', 'TRAINING', 'SLEEP', 'GUT'];

function buildPeriodName(period: InfographicPeriod, startDate: string, endDate: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  };
  if (period === 'today') return 'Hoje';
  if (period === 'week') return `Semana de ${fmt(startDate)} a ${fmt(endDate)}`;
  return `Mês de ${fmt(startDate)} a ${fmt(endDate)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeInfographicScores(logs: any[], userProfile: any) {
  const scores: PillarScores = { WATER: 0, FOOD: 0, TRAINING: 0, SLEEP: 0, GUT: 0 };

  for (const pillar of ALL_PILLARS) {
    const catId = PILLAR_CAT_MAP[pillar];
    const catLogs = logs.filter((l) => l.category?.toLowerCase() === catId);

    if (pillar === 'WATER') {
      const totalMl = catLogs.reduce(
        (acc: number, l: ActivityLog) => acc + (l.details?.quantity_ml ?? 0), 0,
      );
      const target = userProfile?.targets?.water_ml_per_day ?? 2000;
      scores[pillar] = calculateWaterScore(totalMl, target);
    } else if (pillar === 'FOOD') {
      scores[pillar] = historyService.calculateFoodScore(logs, userProfile?.targets);
    } else {
      if (catLogs.length === 0) {
        scores[pillar] = 0;
      } else {
        const avg =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          catLogs.reduce((acc: number, l: any) => acc + (l.primaryValue ?? l.primary_value ?? 0), 0) /
          catLogs.length;
        scores[pillar] = Math.max(0, Math.min(100, Math.round(avg)));
      }
    }
  }

  const globalScore = historyService.calculateDayScore(logs, userProfile);
  const maxScore = Math.max(...ALL_PILLARS.map(p => scores[p]));
  const bestPillars = ALL_PILLARS.filter(p => scores[p] === maxScore);

  return { scores, globalScore, bestPillars };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const REPORT_PERIOD_OPTIONS: { id: ReportPeriod; label: string; icon: string }[] = [
  { id: 'today', label: 'Hoje', icon: '📅' },
  { id: 'week', label: 'Semana', icon: '📆' },
  { id: 'month', label: 'Mês', icon: '🗓️' },
  { id: 'custom', label: 'Período', icon: '📌' },
];

const INFOGRAPHIC_PERIOD_OPTIONS: { id: InfographicPeriod; label: string; icon: string }[] = [
  { id: 'today', label: 'Hoje', icon: '📅' },
  { id: 'week', label: '7 dias', icon: '📆' },
  { id: 'month', label: '30 dias', icon: '🗓️' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function ShareReportDrawer({ open, onOpenChange }: ShareReportDrawerProps) {
  const { user_profile } = useAppStore();

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<Tab>('nutri');

  // ── Report (Nutri) state ──
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);

  // ── Infographic state ──
  const [infoPeriod, setInfoPeriod] = useState<InfographicPeriod>('week');
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoCapturing, setInfoCapturing] = useState(false);
  const [infoReady, setInfoReady] = useState(false);
  const [infographicData, setInfographicData] = useState<{
    scores: PillarScores;
    globalScore: number;
    bestPillars: InfographicPillar[];
    periodName: string;
  } | null>(null);
  const [selectedExport, setSelectedExport] = useState<string>('CARD');

  // ── Squad publish state ──
  const [squadPickerOpen, setSquadPickerOpen] = useState(false);
  const [publishingSquadId, setPublishingSquadId] = useState<string | null>(null);

  const nodeRef = useRef<HTMLDivElement>(null);

  const today = getTodayLocal();
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

  // ── Infographic handlers ──────────────────────────────────────────────────

  const getAvailableExports = useCallback(() => {
    if (!infographicData) return [];
    const options = [
      { id: 'CARD', label: 'Card Completo' },
      { id: 'STICKER_GLOBAL', label: 'Resumo Geral' },
    ];
    ALL_PILLARS.forEach(p => {
      if (infographicData.scores[p] > 0) {
        const labels: Record<string, string> = {
          WATER: 'Água', FOOD: 'Alimentação', TRAINING: 'Treino', SLEEP: 'Sono', GUT: 'Intestino'
        };
        options.push({ id: `STICKER_${p}`, label: `Sticker: ${labels[p]}` });
      }
    });
    return options;
  }, [infographicData]);

  const handleGenerateInfographic = useCallback(async () => {
    setInfoLoading(true);
    setInfoReady(false);
    setInfographicData(null);
    try {
      const { startDate, endDate } = getInfographicDateRange(infoPeriod);
      const params = new URLSearchParams({ startDate, endDate, limit: '200', page: '1' });
      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao buscar registros');
      const data: { logs: ActivityLog[] } = await res.json();
      const logs = data.logs ?? [];

      const { scores, globalScore, bestPillars } = computeInfographicScores(logs, user_profile);
      const periodName = buildPeriodName(infoPeriod, startDate, endDate);

      setInfographicData({ scores, globalScore, bestPillars, periodName });
      setInfoReady(true);
    } catch {
      toast.error('Não foi possível gerar o infográfico. Tente novamente.');
    } finally {
      setInfoLoading(false);
    }
  }, [infoPeriod, user_profile]);

  const captureBlob = useCallback(async (): Promise<Blob | null> => {
    if (!nodeRef.current) return null;
    const isSticker = selectedExport.startsWith('STICKER');
    const options = isSticker 
      ? { cacheBust: true, pixelRatio: 2, backgroundColor: 'rgba(0,0,0,0)' }
      : { cacheBust: true, pixelRatio: 2, width: 375, height: 667 };
    return toBlob(nodeRef.current, options);
  }, [selectedExport]);

  const handleShareInfographic = useCallback(async () => {
    setInfoCapturing(true);
    try {
      const blob = await captureBlob();
      if (!blob) throw new Error('Blob vazio');
      const file = new File([blob], 'orgulho-da-nutri.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Meu Orgulho da Nutri',
          text: 'Olha como foi meu foco no Orgulho da Nutri! 💪 https://orgulhodanutri.com',
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'orgulho-da-nutri.png';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Imagem salva!', { description: 'O infográfico foi baixado para o seu dispositivo.' });
      }
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      if (!isAbort) toast.error('Não foi possível compartilhar. Tente salvar a imagem.');
    } finally {
      setInfoCapturing(false);
    }
  }, [captureBlob]);

  const handleDownloadInfographic = useCallback(async () => {
    setInfoCapturing(true);
    try {
      const blob = await captureBlob();
      if (!blob) throw new Error('Blob vazio');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orgulho-da-nutri.png';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Imagem salva!', { description: 'O infográfico foi baixado com sucesso.' });
    } catch {
      toast.error('Não foi possível salvar a imagem.');
    } finally {
      setInfoCapturing(false);
    }
  }, [captureBlob]);

  /**
   * Captures the Card (always with solid background), converts to Base64
   * and calls the Server Action to upload to Cloudinary + create the Post.
   */
  const handlePublishToSquad = useCallback(async (squadId: string, squadName: string) => {
    setPublishingSquadId(squadId);
    setInfoCapturing(true);
    try {
      // Force the CARD format (with background) for squad posts
      const prevExport = selectedExport;
      if (prevExport !== 'CARD') {
        // We temporarily capture as CARD. The nodeRef renders as CARD because
        // we pass 'CARD' check to the off-screen node (it always renders the
        // selected export). Re-render happens synchronously before toBlob.
      }

      // Capture the full-size card
      const options = { cacheBust: true, pixelRatio: 2, width: 375, height: 667 };
      if (!nodeRef.current) throw new Error('Elemento não encontrado.');
      const blob = await toBlob(nodeRef.current, options);
      if (!blob) throw new Error('Falha ao capturar o card.');

      // Call Server Action with native FormData (bypasses Next.js JSON body size limits)
      const formData = new FormData();
      formData.append('file', blob, 'orgulho-da-nutri.png');
      formData.append('squadId', squadId);
      formData.append('content', `Meu progresso — ${infographicData?.periodName ?? 'hoje'} 💪`);

      const result = await publishCardToSquad(formData);

      if (!result.success) throw new Error(result.error);

      setSquadPickerOpen(false);
      toast.success(`Publicado em ${squadName}! 🎉`, {
        description: 'Seu card já aparece no feed do Squad.',
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao publicar.';
      toast.error(msg);
    } finally {
      setInfoCapturing(false);
      setPublishingSquadId(null);
    }
  }, [nodeRef, selectedExport, infographicData]);

  // ── Reset on close ────────────────────────────────────────────────────────

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setTimeout(() => {
        setReportText(null);
        setReportPeriod('today');
        setCustomStart('');
        setCustomEnd('');
        setInfoReady(false);
        setInfographicData(null);
        setInfoPeriod('week');
        setSelectedExport('CARD');
        setActiveTab('nutri');
        setSquadPickerOpen(false);
      }, 300);
    }
    onOpenChange(v);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="!bg-purple-50/95 backdrop-blur-2xl border-t border-purple-200 text-purple-950 shadow-[0_-15px_60px_-10px_rgba(88,28,135,0.15)] rounded-t-[32px] px-6 pb-6 max-h-[85vh] flex flex-col">
          <DrawerHeader className="px-0 shrink-0">
            <DrawerTitle className="text-title-2 text-purple-950 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Compartilhar
            </DrawerTitle>
          </DrawerHeader>

          <div className="overflow-y-auto flex-1 pb-4">

          {/* ── Tab switcher ── */}
          <div className="flex rounded-2xl bg-purple-100/60 border border-purple-200 p-1 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab('nutri')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all',
                activeTab === 'nutri'
                  ? 'bg-white shadow-sm text-purple-700'
                  : 'text-purple-600/70 hover:text-purple-700',
              )}
              id="tab-nutri-report"
            >
              <Sparkles className="h-4 w-4" />
              Para Nutri
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('infographic')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all',
                activeTab === 'infographic'
                  ? 'bg-white shadow-sm text-purple-700'
                  : 'text-purple-600/70 hover:text-purple-700',
              )}
              id="tab-infographic"
            >
              <ImageIcon className="h-4 w-4" />
              Imagens/Stickers
            </button>
          </div>

          {/* ════════════════════════════════════
              TAB 1: Nutri Text Report
              ════════════════════════════════════ */}
          {activeTab === 'nutri' && (
            <div className="flex flex-col space-y-6">
              <p className="text-body-2 text-purple-900/70 -mt-2">
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
          )}

          {/* ════════════════════════════════════
              TAB 2: Infographic
              ════════════════════════════════════ */}
          {activeTab === 'infographic' && (
            <div className="flex flex-col space-y-5">
              <p className="text-body-2 text-purple-900/70 -mt-2">
                Gere um card no estilo Stories para compartilhar seu progresso.
              </p>

              {/* Period selector */}
              <div className="space-y-2">
                <p className="text-caption-1 font-semibold text-purple-700 uppercase tracking-wide">
                  Período
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {INFOGRAPHIC_PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setInfoPeriod(opt.id);
                        setInfoReady(false);
                        setInfographicData(null);
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center h-16 rounded-2xl border text-sm font-medium transition-all',
                        infoPeriod === opt.id
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

              {/* Preview */}
              {infoReady && infographicData && (
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <p className="text-caption-1 font-semibold text-purple-700 uppercase tracking-wide">
                      Formato de Exportação
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {getAvailableExports().map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedExport(opt.id)}
                          className={cn(
                            'shrink-0 px-4 py-2 rounded-xl border text-sm font-medium transition-all whitespace-nowrap',
                            selectedExport === opt.id
                              ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                              : 'bg-white/60 border-purple-200 text-purple-800 hover:bg-purple-100'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <p className="text-caption-1 font-semibold text-purple-700 uppercase tracking-wide self-start">
                      Pré-visualização
                    </p>
                    <div
                      style={{
                        width: selectedExport === 'CARD' ? '200px' : 'auto',
                        height: selectedExport === 'CARD' ? '355px' : 'auto',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(88,28,135,0.25)',
                        border: '2px solid rgba(139,92,246,0.3)',
                        background: selectedExport === 'CARD' ? 'transparent' : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                        padding: selectedExport === 'CARD' ? '0' : '20px',
                        display: selectedExport === 'CARD' ? 'block' : 'flex',
                        alignItems: selectedExport === 'CARD' ? 'stretch' : 'center',
                        justifyContent: selectedExport === 'CARD' ? 'flex-start' : 'center',
                      }}
                    >
                      {selectedExport === 'CARD' ? (
                        <div style={{ transform: 'scale(0.533)', transformOrigin: 'top left', width: '375px', height: '667px' }}>
                          <ShareableInfographic
                            periodName={infographicData.periodName}
                            scores={infographicData.scores}
                            globalScore={infographicData.globalScore}
                            bestPillars={infographicData.bestPillars}
                          />
                        </div>
                      ) : (
                        <div style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
                          <ShareableSticker
                            type={selectedExport === 'STICKER_GLOBAL' ? 'GLOBAL' : (selectedExport.replace('STICKER_', '') as InfographicPillar)}
                            score={selectedExport === 'STICKER_GLOBAL' ? infographicData.globalScore : infographicData.scores[selectedExport.replace('STICKER_', '') as InfographicPillar]}
                            metadata={selectedExport === 'STICKER_GLOBAL' ? infographicData.periodName : ''}
                            pillarScores={selectedExport === 'STICKER_GLOBAL' ? infographicData.scores : undefined}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Generate button */}
              {!infoReady && (
                <Button
                  onClick={handleGenerateInfographic}
                  disabled={infoLoading}
                  className="h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-button-1 shadow-md flex items-center justify-center gap-2 w-full"
                  id="btn-generate-infographic"
                >
                  {infoLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Calculando...</>
                  ) : (
                    <><ImageIcon className="h-4 w-4" />Gerar Imagens e Stickers</>
                  )}
                </Button>
              )}

              {/* Share / Download actions */}
              {infoReady && infographicData && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleDownloadInfographic}
                      disabled={infoCapturing}
                      className="flex-1 h-12 rounded-2xl border border-purple-300 bg-white/60 text-purple-800 hover:bg-purple-100 text-button-1 flex items-center justify-center gap-2"
                      id="btn-download-infographic"
                    >
                      {infoCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Salvar
                    </Button>
                    <Button
                      onClick={handleShareInfographic}
                      disabled={infoCapturing}
                      className="flex-1 h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-button-1 flex items-center justify-center gap-2 shadow-md"
                      id="btn-share-infographic"
                    >
                      {infoCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                      Compartilhar
                    </Button>
                  </div>

                  {/* Publish to Squad — zero friction */}
                  <Button
                    onClick={() => setSquadPickerOpen(true)}
                    disabled={infoCapturing}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-button-1 flex items-center justify-center gap-2 shadow-md shadow-brand-500/25"
                    id="btn-publish-to-squad"
                  >
                    {infoCapturing && publishingSquadId ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Publicando...</>
                    ) : (
                      <><Users className="h-4 w-4" />Publicar no Squad</>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setInfoReady(false); setInfographicData(null); }}
                    className="w-full text-caption-1 text-purple-500 hover:text-purple-700 underline underline-offset-2 transition-colors"
                  >
                    Alterar período
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ─── Off-screen infographic/sticker node (captured by html-to-image) ─── */}
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
          {selectedExport === 'CARD' ? (
            <ShareableInfographic
              ref={nodeRef}
              periodName={infographicData.periodName}
              scores={infographicData.scores}
              globalScore={infographicData.globalScore}
              bestPillars={infographicData.bestPillars}
            />
          ) : (
            <ShareableSticker
              ref={nodeRef}
              type={selectedExport === 'STICKER_GLOBAL' ? 'GLOBAL' : (selectedExport.replace('STICKER_', '') as InfographicPillar)}
              score={selectedExport === 'STICKER_GLOBAL' ? infographicData.globalScore : infographicData.scores[selectedExport.replace('STICKER_', '') as InfographicPillar]}
              metadata={selectedExport === 'STICKER_GLOBAL' ? infographicData.periodName : ''}
              pillarScores={selectedExport === 'STICKER_GLOBAL' ? infographicData.scores : undefined}
            />
          )}
        </div>
      )}

      {/* ─── Squad Picker Modal ──────────────────────────────────────────── */}
      <SquadPickerModal
        open={squadPickerOpen}
        onOpenChange={setSquadPickerOpen}
        onSelectSquad={handlePublishToSquad}
        isPublishing={infoCapturing}
        publishingSquadId={publishingSquadId}
      />
    </>
  );
}
