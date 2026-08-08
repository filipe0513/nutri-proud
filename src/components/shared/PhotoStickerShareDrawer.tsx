'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Camera,
  ImageIcon,
  Download,
  Share2,
  Users,
  Loader2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { toBlob } from 'html-to-image';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ShareableSticker } from '@/components/share/ShareableSticker';
import type { StickerType, StickerTheme } from '@/components/share/ShareableSticker';
import { publishCardToTeam } from '@/app/actions/publishCardToTeam';
import { fetchMyTeams } from '@/store/api';
import type { InfographicPillar } from '@/components/share/ShareableInfographic';
import type { TeamSummary } from '@/types/teamTypes';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type StickerContext =
  | { type: 'DAILY_SCORE'; score: number; pillarScores?: Partial<Record<InfographicPillar, number>> }
  | { type: 'PILLAR'; pillar: InfographicPillar; score: number }
  | { type: 'EVOLUTION' };

interface PhotoStickerShareDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: StickerContext;
  /** Called for EVOLUTION context after compositing: saves to DB + optionally posts to squad */
  onComposed?: (blob: Blob, weight?: number, publishToTeam?: boolean) => Promise<void>;
  /** Opens the legacy infographic drawer as a secondary option */
  onOpenInfographic?: () => void;
  /** Pre-fills the weight input for EVOLUTION context */
  initialWeight?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getStickerType(context: StickerContext): StickerType {
  if (context.type === 'DAILY_SCORE') return 'GLOBAL';
  if (context.type === 'PILLAR') return context.pillar;
  return 'WEIGHT';
}

function getStickerScore(context: StickerContext, weight: number): number {
  if (context.type === 'DAILY_SCORE') return context.score;
  if (context.type === 'PILLAR') return context.score;
  return weight;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const THEMES: { value: StickerTheme; label: string; previewStyle: React.CSSProperties }[] = [
  {
    value: 'dark',
    label: 'Dark',
    previewStyle: { background: 'rgba(0,0,0,0.7)' },
  },
  {
    value: 'light',
    label: 'Light',
    previewStyle: { background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.1)' },
  },
  {
    value: 'gradient',
    label: 'Grad',
    previewStyle: { background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)' },
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function PhotoStickerShareDrawer({
  open,
  onOpenChange,
  context,
  onComposed,
  onOpenInfographic,
  initialWeight = 70,
}: PhotoStickerShareDrawerProps) {
  const [step, setStep] = useState<'source' | 'compose'>('source');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<StickerTheme>('dark');
  const [weight, setWeight] = useState(initialWeight);
  const [publishToTeam, setPublishToTeam] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [publishingTeamId, setPublishingTeamId] = useState<string | null>(null);

  const compositeRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<Blob | null>(null);
  // Prevents duplicate onComposed calls when user taps multiple actions
  const composedRef = useRef(false);

  // ── File selection ───────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
    blobRef.current = null;
    setStep('compose');
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  // ── Blob capture (lazy + cached) ─────────────────────────────────────────────

  const getBlob = useCallback(async (): Promise<Blob> => {
    if (blobRef.current) return blobRef.current;
    if (!compositeRef.current) throw new Error('Falha ao capturar imagem.');
    const img = compositeRef.current.querySelector('img');
    if (img && !img.complete) {
      await new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
      });
    }
    const blob = await toBlob(compositeRef.current, { pixelRatio: 2 });
    if (!blob) throw new Error('Falha ao capturar imagem.');
    blobRef.current = blob;
    return blob;
  }, []);

  // ── Call onComposed once (evolution DB save + squad post) ────────────────────

  const callOnComposed = useCallback(
    async (blob: Blob) => {
      if (composedRef.current || !onComposed) return;
      composedRef.current = true;
      await onComposed(blob, context.type === 'EVOLUTION' ? weight : undefined, publishToTeam);
    },
    [onComposed, context, weight, publishToTeam]
  );

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    setIsActing(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], 'orgulho-nutri.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Meu Progresso',
          text: 'Progresso no Orgulho da Nutri! 💪',
        });
      } else {
        triggerDownload(blob, 'orgulho-nutri.png');
      }
      if (context.type === 'EVOLUTION') {
        onOpenChange(false);
        toast.success('Processando check-in...', { description: 'Sua evolução está sendo salva.' });
        await callOnComposed(blob);
      }
    } catch (err) {
      const name = (err as Error)?.name;
      if (name !== 'AbortError') toast.error('Erro ao compartilhar.');
    } finally {
      setIsActing(false);
    }
  };

  const handleSave = async () => {
    setIsActing(true);
    try {
      const blob = await getBlob();
      triggerDownload(blob, 'orgulho-nutri.png');
      toast.success('Imagem salva!', {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
      if (context.type === 'EVOLUTION') {
        onOpenChange(false);
        await callOnComposed(blob);
      }
    } catch {
      toast.error('Erro ao salvar.');
    } finally {
      setIsActing(false);
    }
  };

  const handlePublishTap = async () => {
    // EVOLUTION: onComposed handles the full save + squad post flow
    if (context.type === 'EVOLUTION' && onComposed) {
      setIsActing(true);
      try {
        const blob = await getBlob();
        await callOnComposed(blob);
        onOpenChange(false);
      } catch {
        toast.error('Erro ao publicar.');
      } finally {
        setIsActing(false);
      }
      return;
    }
    // Other contexts: fetch teams and show inline picker
    setLoadingTeams(true);
    try {
      const data = await fetchMyTeams();
      setTeams(data);
      setTeamPickerOpen(true);
    } catch {
      toast.error('Erro ao buscar squads.');
    } finally {
      setLoadingTeams(false);
    }
  };

  const handlePublishToTeam = async (teamId: string) => {
    setPublishingTeamId(teamId);
    try {
      const blob = await getBlob();
      const formData = new FormData();
      formData.append('file', blob, 'share.png');
      formData.append('teamId', teamId);
      formData.append('content', 'Progresso compartilhado no Orgulho da Nutri! 💪');
      const result = await publishCardToTeam(formData);
      if (!result.success) throw new Error(result.error ?? 'Erro ao publicar.');
      toast.success('Publicado no squad!', {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
      setTeamPickerOpen(false);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao publicar no squad.');
    } finally {
      setPublishingTeamId(null);
    }
  };

  // ── Drawer lifecycle ─────────────────────────────────────────────────────────

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      composedRef.current = false;
      setTimeout(() => {
        setStep('source');
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        setPhotoUrl(null);
        blobRef.current = null;
      }, 300);
    }
    onOpenChange(v);
  };

  // ── Derived values ───────────────────────────────────────────────────────────

  const stickerType = getStickerType(context);
  const stickerScore = getStickerScore(context, weight);
  const pillarScores = context.type === 'DAILY_SCORE' ? context.pillarScores : undefined;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white/40 max-w-lg mx-auto">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-title-3 font-bold text-neutral-600 text-center">
              {step === 'source' ? 'Escolher Foto' : 'Personalizar'}
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-8 space-y-4 overflow-y-auto max-h-[70vh]">
            {/* ── Step 1: Source picker ───────────────────────────────────── */}
            {step === 'source' && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={cameraInputRef}
                  onChange={handleFileSelect}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={galleryInputRef}
                  onChange={handleFileSelect}
                />

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full h-28 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 flex flex-col items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                >
                  <Camera className="h-8 w-8 text-brand-500" />
                  <span className="text-body-2 font-semibold text-brand-600">Tirar Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full h-28 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50 flex flex-col items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                >
                  <ImageIcon className="h-8 w-8 text-neutral-500" />
                  <span className="text-body-2 font-semibold text-neutral-600">Escolher da Galeria</span>
                </button>

                {onOpenInfographic && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenChange(false);
                      onOpenInfographic();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-caption-1 font-medium text-brand-500 hover:text-brand-600 transition-colors py-1"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Gerar Infográfico
                  </button>
                )}
              </div>
            )}

            {/* ── Step 2: Compose ─────────────────────────────────────────── */}
            {step === 'compose' && (
              <div className="space-y-4">
                {/* Composite preview (captured by html-to-image) */}
                <div
                  ref={compositeRef}
                  className="relative w-full rounded-3xl overflow-hidden bg-neutral-900"
                  style={{ aspectRatio: '3/4', maxHeight: '420px' }}
                >
                  {photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt="Prévia da foto"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {/* Sticker — fixed bottom-left */}
                  <div className="absolute bottom-0 left-0">
                    <ShareableSticker
                      type={stickerType}
                      score={stickerScore}
                      theme={selectedTheme}
                      pillarScores={pillarScores}
                    />
                  </div>
                </div>

                {/* Theme selector */}
                <div className="flex gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setSelectedTheme(t.value);
                        blobRef.current = null;
                      }}
                      className={cn(
                        'flex-1 h-14 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all bg-white/50',
                        selectedTheme === t.value
                          ? 'border-brand-500 shadow-sm scale-[1.03]'
                          : 'border-transparent'
                      )}
                    >
                      <div
                        className="w-7 h-7 rounded-full shadow-sm"
                        style={t.previewStyle}
                      />
                      <span className="text-caption-2 font-medium text-neutral-500">{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Weight input + team checkbox — EVOLUTION context only */}
                {context.type === 'EVOLUTION' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="sticker-weight"
                        className="text-body-2 font-semibold text-neutral-600 px-1"
                      >
                        Peso Atual (kg)
                      </label>
                      <input
                        id="sticker-weight"
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => {
                          setWeight(parseFloat(e.target.value) || 0);
                          blobRef.current = null;
                        }}
                        className="w-full rounded-2xl border border-white/40 bg-glass-light-1 backdrop-blur-sm px-4 py-3 text-title-3 font-semibold text-neutral-600 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-inner"
                        placeholder="Ex: 75.5"
                      />
                    </div>
                    <label className="flex items-center gap-3 px-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={publishToTeam}
                        onChange={(e) => setPublishToTeam(e.target.checked)}
                        className="w-4 h-4 accent-brand-500 rounded"
                      />
                      <span className="text-body-2 text-neutral-600">Publicar também no squad</span>
                    </label>
                  </div>
                )}

                {/* Share + Save */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl border border-white/40 bg-glass-light-1 text-neutral-700 hover:bg-white/60"
                    onClick={handleShare}
                    disabled={isActing}
                  >
                    {isActing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-1.5" />
                        Compartilhar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl border border-white/40 bg-glass-light-1 text-neutral-700 hover:bg-white/60"
                    onClick={handleSave}
                    disabled={isActing}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Salvar
                  </Button>
                </div>

                {/* Publish to squad */}
                <Button
                  className="w-full h-12 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-button-1 font-bold shadow-md active:scale-[0.98] transition-all"
                  onClick={handlePublishTap}
                  disabled={isActing || loadingTeams}
                >
                  {loadingTeams ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Publicar no Squad
                </Button>

                {/* Secondary: legacy infographic */}
                {onOpenInfographic && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenChange(false);
                      onOpenInfographic();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-caption-1 font-medium text-brand-500 hover:text-brand-600 transition-colors py-1"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Gerar Infográfico
                  </button>
                )}

                {/* Retake photo */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('source');
                    if (photoUrl) URL.revokeObjectURL(photoUrl);
                    setPhotoUrl(null);
                    blobRef.current = null;
                  }}
                  className="w-full text-center text-caption-1 font-medium text-neutral-400 hover:text-neutral-500 transition-colors py-1"
                >
                  Trocar Foto
                </button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Inline team picker — non-EVOLUTION "Publicar no Squad" */}
      <Drawer open={teamPickerOpen} onOpenChange={setTeamPickerOpen}>
        <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white/40 max-w-lg mx-auto">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-title-3 font-bold text-neutral-600 text-center">
              Publicar em qual Squad?
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-3">
            {teams.length === 0 ? (
              <p className="text-body-2 text-neutral-400 text-center py-6">
                Você não está em nenhum squad.
              </p>
            ) : (
              teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  disabled={!!publishingTeamId}
                  onClick={() => handlePublishToTeam(team.id)}
                  className="w-full flex items-center p-4 rounded-2xl bg-brand-50 border border-brand-200 hover:bg-brand-100 active:scale-[0.98] transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-white font-bold text-base">
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-2 font-semibold text-neutral-600 truncate">{team.name}</p>
                    <p className="text-caption-2 text-neutral-400">
                      {team.memberCount} membro{team.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {publishingTeamId === team.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-brand-500 ml-2 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-brand-400 ml-2 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
