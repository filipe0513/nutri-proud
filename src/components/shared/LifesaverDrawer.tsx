'use client';

import { useState, useEffect } from 'react';
import { LifeBuoy, Loader2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { toast } from 'sonner';

export function LifesaverDrawer({
  open,
  onOpenChange,
  scores,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scores: { water: number; food: number; workout: number; sleep: number; poop: number };
}) {
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<string | null>(null);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/lifesaver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar dicas');
      }

      const data = await res.json();
      setTips(data.message);
    } catch (error) {
      toast.error('Erro ao buscar dicas salva-vidas. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !tips) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTips();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);


  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
        <DrawerHeader className="px-0 pb-4">
          <DrawerTitle className="text-title-2 text-neutral-600 flex items-center gap-2">
            <span className="text-red-500"><LifeBuoy className="w-6 h-6" /></span> Missão Salva-Vidas
          </DrawerTitle>
          <p className="text-body-2 text-neutral-500 mt-2">
            Ainda dá tempo de salvar o seu dia! Veja algumas dicas rápidas da Nutri para agora à noite:
          </p>
        </DrawerHeader>

        <div className="mt-4 min-h-[150px] flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-body-2 animate-pulse">Pensando nas melhores estratégias...</p>
            </div>
          ) : tips ? (
            <div className="bg-white/80 p-5 rounded-2xl border border-neutral-200/50 shadow-sm">
              <div dangerouslySetInnerHTML={{ __html: tips }} />
            </div>
          ) : (
            <div className="text-center text-neutral-400">
              <p>Não foi possível carregar as dicas. Tente novamente.</p>
              <button 
                onClick={fetchTips}
                className="mt-4 text-brand-500 font-semibold underline"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
