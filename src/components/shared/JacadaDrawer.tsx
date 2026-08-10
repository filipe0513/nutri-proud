/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Utensils, Trash2 } from 'lucide-react';
import { toLocalISOString } from '@/lib/utils';
import { DatePickerInput } from '@/components/shared/DatePickerInput';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useAppStore } from '@/store/store';
import { useHistoryStore } from '@/store/historyStore';
import { ActivityLog } from '@/store/types';
import { JacadaReactionDrawer } from '@/components/shared/JacadaReactionDrawer';
import { LimitWarningDrawer } from '@/components/shared/LimitWarningDrawer';

const SLIDER_LABELS: Record<number, string> = {
  0: '—',
  1: 'Um pouquinho',
  2: 'Mais ou menos',
  3: 'Muito',
  4: 'Exagerei',
  5: 'Chutei o balde 🤦',
};

function getSliderLabel(value: number): string {
  return SLIDER_LABELS[value] ?? String(value);
}

export function JacadaDrawer({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ActivityLog;
}) {
  const [sugar, setSugar] = useState(0);
  const [fat, setFat] = useState(0);
  const [alcohol, setAlcohol] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialData?.event_time) {
      return toLocalISOString(new Date(initialData.event_time)).slice(0, 16);
    }
    return toLocalISOString(new Date()).slice(0, 16);
  });

  // State for the reaction drawer (shown after creating a new jacada)
  const [reactionOpen, setReactionOpen] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [reactionMessage, setReactionMessage] = useState('');
  const [limitWarningOpen, setLimitWarningOpen] = useState(false);

  const { initializeData, removeLog, updateLog, activeDrawerSource } = useAppStore();
  const { updateLogHistory, deleteLogHistory } = useHistoryStore();

  // Populate fields when editing
  useEffect(() => {
    if (initialData) {
      setSugar(initialData.details?.sugar ?? 0);
      setFat(initialData.details?.fat ?? 0);
      setAlcohol(initialData.details?.alcohol ?? 0);
      setSelectedDate(toLocalISOString(new Date(initialData.event_time)).slice(0, 16));
    }
  }, [initialData]);

  const resetForm = () => {
    setSugar(0);
    setFat(0);
    setAlcohol(0);
    setSelectedDate(toLocalISOString(new Date()).slice(0, 16));
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setTimeout(resetForm, 300);
    }
  };

  const FALLBACK_REACTIONS = [
    'Não consegui analisar agora, mas anota aí: jacada registrada = consciência ativa. Não banaliza. 😬',
    'Sistema offline, mas a jacada não some do histórico. A gente vai conversar sobre isso. 🙅‍♀️',
    'Sem análise agora, mas o registro já diz tudo. Amanhã a gente começa melhor. 😤',
  ];
  const getFallbackReaction = () => FALLBACK_REACTIONS[Date.now() % FALLBACK_REACTIONS.length];

  const fetchAIReaction = async (s: number, f: number, a: number, logId: string) => {
    setReactionLoading(true);
    setReactionOpen(true);
    try {
      const aiRes = await fetch('/api/ai/jacada-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sugar: s, fat: f, alcohol: a, logId }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setReactionMessage(aiData.message);
      } else {
        setReactionMessage(getFallbackReaction());
      }
    } catch {
      setReactionMessage(getFallbackReaction());
    } finally {
      setReactionLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);

      if (initialData) {
        // Editing existing jacada log
        const res = await fetch(`/api/logs/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...initialData,
            event_time: toLocalISOString(new Date(selectedDate)),
            details: { ...initialData.details, sugar, fat, alcohol },
            source: activeDrawerSource || undefined,
          }),
        });

        if (!res.ok) throw new Error('Falha ao atualizar jacada');

        const updated = await res.json();
        updateLog(initialData.id, {
          ...initialData,
          event_time: toLocalISOString(new Date(selectedDate)),
          details: { ...initialData.details, sugar, fat, alcohol },
          primary_value: updated.primary_value ?? initialData.primary_value,
        });
        updateLogHistory(initialData.id, {
          ...initialData,
          event_time: toLocalISOString(new Date(selectedDate)),
          details: { ...initialData.details, sugar, fat, alcohol },
          primary_value: updated.primary_value ?? initialData.primary_value,
        });

        toast.success('Jacada atualizada!', {
          className: 'bg-orange-50 border-orange-200 text-orange-900',
        });
        onOpenChange(false);
        await initializeData();
      } else {
        // Creating new jacada log
        const res = await fetch('/api/logs/jacada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sugar, fat, alcohol,
            event_time: toLocalISOString(new Date(selectedDate)),
            source: activeDrawerSource || undefined
          }),
        });

        if (!res.ok) {
          if (res.status === 403) {
            const body = await res.json().catch(() => ({ error: '' }));
            throw Object.assign(new Error(body?.error ?? 'Limite atingido'), { status: 403 });
          }
          throw new Error('Falha ao registrar jacada');
        }

        const savedData = await res.json();
        const logId: string = savedData?.result?.id ?? '';

        const savedSugar = sugar;
        const savedFat = fat;
        const savedAlcohol = alcohol;

        resetForm();
        onOpenChange(false);

        // Refresh home data then fetch AI reaction (opens reaction drawer)
        await initializeData();
        fetchAIReaction(savedSugar, savedFat, savedAlcohol, logId);
      }
    } catch (error) {
      const asAny = error as { status?: number };
      if (asAny?.status === 403) {
        setLimitWarningOpen(true);
      } else {
        toast.error('Erro ao salvar jacada. Tente novamente.');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || loading) return;
    try {
      setLoading(true);
      await removeLog(initialData.id);
      deleteLogHistory(initialData.id);
      toast.success('Jacada apagada!', {
        className: 'bg-orange-50 border-orange-200 text-orange-900',
      });
      onOpenChange(false);
      await initializeData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao apagar jacada.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialData;
  const savedReaction = initialData?.details?.nutri_reaction;

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
          <DrawerHeader className="px-0 pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-title-2 text-neutral-600 flex items-center gap-2">
                <span className="text-3xl">🍺🍔🍩</span> {isEditing ? 'Editar Jacada' : 'Jacada do Dia'}
              </DrawerTitle>
              <DatePickerInput
                value={selectedDate}
                onChange={setSelectedDate}
                accentColor="text-orange-700"
                borderColor="border-orange-200"
              />
            </div>
            <p className="text-body-2 text-neutral-500 mt-2">
              Avalie de 0 a 5 o impacto do seu deslize. Cada ponto deduz da sua pontuação de alimentação do dia.
            </p>
          </DrawerHeader>

          <div className="space-y-8 mt-4">
            {/* Sugar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-body-1 font-semibold text-neutral-600 flex items-center gap-2">
                  🍩 Açúcar / Doces
                </span>
                <span className="font-semibold text-orange-500 text-sm">{getSliderLabel(sugar)}</span>
              </div>
              <Slider
                value={[sugar]}
                onValueChange={([val]) => setSugar(val)}
                max={5}
                step={1}
              />
              <div className="flex justify-between text-xs text-neutral-400 px-1">
                <button type="button" onClick={() => setSugar(0)} className="cursor-pointer hover:text-neutral-600 transition-colors py-1">Nada</button>
                <button type="button" onClick={() => setSugar(5)} className="cursor-pointer hover:text-neutral-600 transition-colors py-1">Chutei o balde</button>
              </div>
            </div>

            {/* Fat */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-body-1 font-semibold text-neutral-600 flex items-center gap-2">
                  🍔 Frituras / Fast Food
                </span>
                <span className="font-semibold text-orange-500 text-sm">{getSliderLabel(fat)}</span>
              </div>
              <Slider
                value={[fat]}
                onValueChange={([val]) => setFat(val)}
                max={5}
                step={1}
              />
              <div className="flex justify-between text-xs text-neutral-400 px-1">
                <button type="button" onClick={() => setFat(0)} className="cursor-pointer hover:text-neutral-600 transition-colors py-1">Nada</button>
                <button type="button" onClick={() => setFat(5)} className="cursor-pointer hover:text-neutral-600 transition-colors py-1">Chutei o balde</button>
              </div>
            </div>

            {/* Alcohol */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-body-1 font-semibold text-neutral-600 flex items-center gap-2">
                  🍺 Álcool
                </span>
                <span className="font-semibold text-orange-500 text-sm">{getSliderLabel(alcohol)}</span>
              </div>
              <Slider
                value={[alcohol]}
                onValueChange={([val]) => setAlcohol(val)}
                max={5}
                step={1}
              />
              <div className="flex justify-between text-xs text-neutral-400 px-1">
                <button type="button" onClick={() => setAlcohol(0)} className="cursor-pointer hover:text-neutral-600 transition-colors py-1">Nada</button>
                <button type="button" onClick={() => setAlcohol(5)} className="cursor-pointer hover:text-neutral-600 transition-colors py-1">Chutei o balde</button>
              </div>
            </div>

            {/* Saved Nutri reaction (view mode only) */}
            {isEditing && savedReaction && (
              <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥗</span>
                  <p className="text-caption-1 font-bold text-orange-600 uppercase tracking-wide">
                    O que a Nutri disse
                  </p>
                </div>
                <p className="text-body-2 text-neutral-700 leading-relaxed">
                  {savedReaction}
                </p>
              </div>
            )}

            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl border border-orange-200 bg-white/50 text-orange-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 flex-shrink-0"
                  onClick={handleDelete}
                  title="Apagar registro"
                  disabled={loading}
                >
                  <Trash2 size={18} />
                </Button>
                <button
                  onClick={handleRegister}
                  disabled={loading || (sugar === 0 && fat === 0 && alcohol === 0)}
                  className="flex-1 h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-button-1 transition-all shadow-lg disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                  <Utensils className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={loading || (sugar === 0 && fat === 0 && alcohol === 0)}
                className="w-full h-14 mt-4 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-button-1 transition-all shadow-lg disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? 'Registrando...' : 'Registrar Jacada'}
                <Utensils className="w-5 h-5" />
              </button>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Reaction drawer — shown after new jacada is saved */}
      <JacadaReactionDrawer
        open={reactionOpen}
        onOpenChange={setReactionOpen}
        message={reactionMessage}
        isLoading={reactionLoading}
      />
      <LimitWarningDrawer
        isOpen={limitWarningOpen}
        onClose={() => setLimitWarningOpen(false)}
        onContinueAnyway={() => setLimitWarningOpen(false)}
      />
    </>
  );
}
