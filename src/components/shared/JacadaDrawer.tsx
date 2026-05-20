'use client';

import { useState } from 'react';
import { Utensils } from 'lucide-react';
import { toLocalISOString } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useAppStore } from '@/store/store';

export function JacadaDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [sugar, setSugar] = useState(0);
  const [fat, setFat] = useState(0);
  const [alcohol, setAlcohol] = useState(0);
  const [loading, setLoading] = useState(false);

  const { initializeData } = useAppStore();

  const handleRegister = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/logs/jacada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sugar, fat, alcohol, event_time: toLocalISOString(new Date()) }),
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar jacada');
      }

      toast.success('Jacada registrada!', {
        description: 'Os pontos foram deduzidos da sua alimentação de hoje.',
        className: 'bg-orange-50 border-orange-200 text-orange-900',
      });

      // Reset
      setSugar(0);
      setFat(0);
      setAlcohol(0);

      // Refresh data
      await initializeData();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao registrar jacada. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
        <DrawerHeader className="px-0 pb-4">
          <DrawerTitle className="text-title-2 text-neutral-600 flex items-center gap-2">
            <span className="text-3xl">🍺🍔🍩</span> Jacada do Dia
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
              <span className="font-bold text-orange-500 text-lg">{sugar}</span>
            </div>
            <Slider
              value={[sugar]}
              onValueChange={([val]) => setSugar(val)}
              max={5}
              step={1}
            />
            <div className="flex justify-between text-xs text-neutral-400 px-1">
              <span>0 (Nada)</span>
              <span>5 (Muito)</span>
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-body-1 font-semibold text-neutral-600 flex items-center gap-2">
                🍔 Frituras / Fast Food
              </span>
              <span className="font-bold text-orange-500 text-lg">{fat}</span>
            </div>
            <Slider
              value={[fat]}
              onValueChange={([val]) => setFat(val)}
              max={5}
              step={1}
            />
            <div className="flex justify-between text-xs text-neutral-400 px-1">
              <span>0 (Nada)</span>
              <span>5 (Muito)</span>
            </div>
          </div>

          {/* Alcohol */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-body-1 font-semibold text-neutral-600 flex items-center gap-2">
                🍺 Álcool
              </span>
              <span className="font-bold text-orange-500 text-lg">{alcohol}</span>
            </div>
            <Slider
              value={[alcohol]}
              onValueChange={([val]) => setAlcohol(val)}
              max={5}
              step={1}
            />
            <div className="flex justify-between text-xs text-neutral-400 px-1">
              <span>0 (Nada)</span>
              <span>5 (Muito)</span>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading || (sugar === 0 && fat === 0 && alcohol === 0)}
            className="w-full h-14 mt-4 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-button-1 transition-all shadow-lg disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? 'Registrando...' : 'Registrar Jacada'}
            <Utensils className="w-5 h-5" />
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
