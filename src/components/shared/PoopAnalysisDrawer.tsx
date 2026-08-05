'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface PoopAnalysisDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: string;
  isLoading?: boolean;
}

export function PoopAnalysisDrawer({
  open,
  onOpenChange,
  analysis,
  isLoading = false,
}: PoopAnalysisDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!bg-amber-50/95 backdrop-blur-lg border-t border-amber-200 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
        <DrawerHeader className="px-0 pb-4">
          <DrawerTitle className="text-title-2 text-amber-950 flex items-center gap-2">
            <span className="text-3xl">💩</span> Análise da Nutri
          </DrawerTitle>
          <p className="text-body-2 text-amber-800/70 mt-1">
            Correlação com sua alimentação recente.
          </p>
        </DrawerHeader>

        <div className="mt-2 mb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
              </div>
              <p className="text-body-2 text-amber-700/70 animate-pulse">
                Nutri está analisando...
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/70 border border-amber-200 p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-lg flex-shrink-0">
                  🥗
                </div>
                <div>
                  <p className="text-caption-1 font-bold text-amber-700 uppercase tracking-wide">
                    Nutri diz
                  </p>
                </div>
              </div>
              <p className="text-body-1 text-neutral-700 leading-relaxed font-medium">
                {analysis}
              </p>
            </div>
          )}
        </div>

        {!isLoading && (
          <button
            onClick={() => onOpenChange(false)}
            className="w-full h-14 rounded-2xl bg-amber-800 hover:bg-amber-900 active:scale-95 text-white font-bold text-button-1 transition-all shadow-md"
          >
            Entendido 👍
          </button>
        )}
      </DrawerContent>
    </Drawer>
  );
}
