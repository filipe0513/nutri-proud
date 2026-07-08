'use client';

import { Sparkles, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/store';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';

/** Map from the CTA field (uppercase pillar name) to drawer key + human-readable label */
const CTA_MAP: Record<string, { label: string; drawerKey: 'water' | 'meal' | 'sleep' | 'workout' | 'poop' }> = {
  WATER:   { label: 'Registrar Água',        drawerKey: 'water' },
  FOOD:    { label: 'Registrar Refeição',     drawerKey: 'meal' },
  SLEEP:   { label: 'Registrar Sono',         drawerKey: 'sleep' },
  WORKOUT: { label: 'Registrar Treino',       drawerKey: 'workout' },
  POOP:    { label: 'Registrar Intestino',    drawerKey: 'poop' },
};

interface InsightsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string | null;
  /** Uppercase pillar name or null */
  cta?: string | null;
}

export function InsightsDrawer({ open, onOpenChange, message, cta }: InsightsDrawerProps) {
  const setOpenDrawer = useAppStore(state => state.setActiveDrawer);

  const ctaInfo = cta ? CTA_MAP[cta.toUpperCase()] : null;

  const handleInternalOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      fetch('/api/events', { method: 'POST', body: JSON.stringify({ eventName: 'AI_DRAWER_DISMISSED' }) }).catch(() => {});
    }
  };

  const handleCta = () => {
    fetch('/api/events', { method: 'POST', body: JSON.stringify({ eventName: 'AI_DRAWER_CONVERTED' }) }).catch(() => {});
    // Fecha o InsightsDrawer e abre o drawer de registro correspondente — sem navegação
    onOpenChange(false);
    if (ctaInfo) {
      // Pequeno delay para o fechamento animar antes de abrir o próximo drawer
      setTimeout(() => setOpenDrawer(ctaInfo.drawerKey, 'AI_DRAWER'), 300);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleInternalOpenChange}>
      <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        {/* Close button */}
        <div className="flex justify-end pt-2 -mb-2">
          <DrawerClose asChild>
            <button
              type="button"
              aria-label="Fechar"
              className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-neutral-500" />
            </button>
          </DrawerClose>
        </div>

        <DrawerHeader className="px-0 pb-4 pt-2">
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/30 flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <DrawerTitle className="text-title-2 text-neutral-600">
              Insights da Nutri ✨
            </DrawerTitle>
          </div>
          <p className="text-caption-1 text-neutral-400 pl-1">
            Sua assistente de saúde tem uma mensagem para você
          </p>
        </DrawerHeader>

        {/* Message */}
        <div className="bg-white/80 rounded-2xl border border-neutral-200/60 p-5 shadow-sm space-y-1 min-h-[80px]">
          {message ? (
            <p className="text-body-1 text-neutral-600 leading-relaxed">{message}</p>
          ) : (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-full bg-neutral-200 rounded-md" />
              <div className="h-4 w-5/6 bg-neutral-200 rounded-md" />
              <div className="h-4 w-3/4 bg-neutral-200 rounded-md" />
            </div>
          )}
        </div>

        {/* CTA Button */}
        {ctaInfo && message && (
          <button
            type="button"
            onClick={handleCta}
            className="mt-5 w-full h-14 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-button-1 shadow-lg shadow-violet-500/30 hover:from-violet-400 hover:to-indigo-400 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{ctaInfo.label}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        )}

        {/* Dismiss link */}
        <DrawerClose asChild>
          <button
            type="button"
            className="mt-4 w-full text-center text-caption-1 text-neutral-400 hover:text-neutral-500 transition-colors py-2"
          >
            Fechar
          </button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}
