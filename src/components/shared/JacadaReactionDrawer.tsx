'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface JacadaReactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  isLoading?: boolean;
}

export function JacadaReactionDrawer({
  open,
  onOpenChange,
  message,
  isLoading = false,
}: JacadaReactionDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
        <DrawerHeader className="px-0 pb-4">
          <DrawerTitle className="text-title-2 text-neutral-600 flex items-center gap-2">
            <span className="text-3xl">🍽️</span> Feedback da nutri
          </DrawerTitle>
          <p className="text-body-2 text-neutral-400 mt-1">
            {isLoading 
              ? 'A nutri está analisando sua jacada para dar um feedback honesto...' 
              : 'A nutri analisou sua jacada e deixou um feedback honesto, sem filtro.'}
          </p>
        </DrawerHeader>

        <div className="mt-2 mb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
                <div className="absolute inset-0 rounded-full border-4 border-orange-400 border-t-transparent animate-spin" />
              </div>
              <p className="text-body-2 text-neutral-400 animate-pulse">
                Nutri está analisando...
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-orange-50 border border-orange-200 p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-lg flex-shrink-0">
                  🥗
                </div>
                <div>
                  <p className="text-caption-1 font-bold text-orange-600 uppercase tracking-wide">
                    Nutri diz
                  </p>
                </div>
              </div>
              <p className="text-body-1 text-neutral-700 leading-relaxed font-medium">
                {message}
              </p>
            </div>
          )}
        </div>

        {!isLoading && (
          <button
            onClick={() => onOpenChange(false)}
            className="w-full h-14 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-bold text-button-1 transition-all shadow-md"
          >
            Entendido 👊
          </button>
        )}
      </DrawerContent>
    </Drawer>
  );
}
