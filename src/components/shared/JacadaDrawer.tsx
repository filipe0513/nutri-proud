/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Utensils, Trash2 } from 'lucide-react';
import { toLocalISOString } from '@/lib/utils';
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

  const { initializeData, removeLog, updateLog, activeDrawerSource } = useAppStore();
  const { updateLogHistory, deleteLogHistory } = useHistoryStore();

  // Populate fields when editing
  useEffect(() => {
    if (initialData) {
      setSugar(initialData.details?.sugar ?? 0);
      setFat(initialData.details?.fat ?? 0);
      setAlcohol(initialData.details?.alcohol ?? 0);
    }
  }, [initialData]);

  const resetForm = () => {
    setSugar(0);
    setFat(0);
    setAlcohol(0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setTimeout(resetForm, 300);
    }
  };

  const fetchAIReaction = async (s: number, f: number, a: number) => {
    const toastId = toast.loading('Nutri analisando deslize...');
    try {
      const aiRes = await fetch('/api/ai/jacada-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sugar: s, fat: f, alcohol: a }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        toast.success('Nutri diz:', {
          id: toastId,
          description: aiData.message,
          className: 'bg-orange-50 border-orange-200 text-orange-900',
        });
      } else {
        toast.success('Jacada registrada!', {
          id: toastId,
          description: 'Os pontos foram deduzidos da sua alimentação de hoje.',
          className: 'bg-orange-50 border-orange-200 text-orange-900',
        });
      }
    } catch {
      toast.success('Jacada registrada!', {
        id: toastId,
        description: 'Os pontos foram deduzidos da sua alimentação de hoje.',
        className: 'bg-orange-50 border-orange-200 text-orange-900',
      });
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
            details: { sugar, fat, alcohol },
            source: activeDrawerSource || undefined,
          }),
        });

        if (!res.ok) throw new Error('Falha ao atualizar jacada');

        const updated = await res.json();
        updateLog(initialData.id, { ...initialData, details: { sugar, fat, alcohol }, primary_value: updated.primary_value ?? initialData.primary_value });
        updateLogHistory(initialData.id, { ...initialData, details: { sugar, fat, alcohol }, primary_value: updated.primary_value ?? initialData.primary_value });

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
            event_time: toLocalISOString(new Date()),
            source: activeDrawerSource || undefined 
          }),
        });

        if (!res.ok) throw new Error('Falha ao registrar jacada');

        const savedSugar = sugar;
        const savedFat = fat;
        const savedAlcohol = alcohol;

        resetForm();
        onOpenChange(false);

        // Fire and forget: AI reaction
        fetchAIReaction(savedSugar, savedFat, savedAlcohol);
        await initializeData();
      }
    } catch (error) {
      toast.error('Erro ao salvar jacada. Tente novamente.');
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

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
        <DrawerHeader className="px-0 pb-4">
          <DrawerTitle className="text-title-2 text-neutral-600 flex items-center gap-2">
            <span className="text-3xl">🍺🍔🍩</span> {isEditing ? 'Editar Jacada' : 'Jacada do Dia'}
          </DrawerTitle>
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
              <span>Nada</span>
              <span>Chutei o balde</span>
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
              <span>Nada</span>
              <span>Chutei o balde</span>
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
              <span>Nada</span>
              <span>Chutei o balde</span>
            </div>
          </div>

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
  );
}
