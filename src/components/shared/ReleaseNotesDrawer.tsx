'use client';

import { Sparkles, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import releaseNotesData from '@/data/release-notes.json';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReleaseNotesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVersion: string;
}

export function ReleaseNotesDrawer({ open, onOpenChange, currentVersion }: ReleaseNotesDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
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
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="h-5 w-5 text-orange-500" />
            </div>
            <DrawerTitle className="text-title-2 text-neutral-600">
              Novidades
            </DrawerTitle>
          </div>
          <p className="text-caption-1 text-neutral-400 pl-1">
            Veja o que mudou nas últimas versões do app.
          </p>
        </DrawerHeader>

        {/* Notes List */}
        <div className="overflow-y-auto max-h-[50vh] pr-2 space-y-6 scrollbar-hide pb-4">
          {releaseNotesData.map((release) => {
            const isCurrent = release.version === currentVersion;
            
            return (
              <div key={release.version} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-caption-2 font-bold ${
                    isCurrent 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    v{release.version}
                  </span>
                  <span className="text-caption-2 text-neutral-400">
                    {format(parseISO(release.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                <ul className="space-y-2 pl-2">
                  {release.highlights.map((highlight, index) => (
                    <li key={index} className="text-body-2 text-neutral-600 flex items-start">
                      <span className="mr-2 text-neutral-300">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
