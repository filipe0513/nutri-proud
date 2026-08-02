'use client';

import { BarChart3, FileText } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useAppStore } from '@/store/store';
import { historyService } from '@/services/historyService';

interface ShareToTeamDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareScore: (score: number) => void;
}

export function ShareToTeamDrawer({
  open,
  onOpenChange,
  onShareScore,
}: ShareToTeamDrawerProps) {
  const { activity_logs, user_profile } = useAppStore();

  const handleShareScore = () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayLogs = activity_logs.filter(
      (log) => new Date(log.event_time) >= startOfDay
    );
    const score = historyService.calculateDayScore(todayLogs, user_profile);
    
    onShareScore(score);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
        <DrawerHeader className="px-0 pb-4">
          <DrawerTitle className="text-title-3 text-neutral-500 text-center">
            Criar Postagem no Time
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleShareScore}
            className="w-full flex items-center p-4 rounded-2xl bg-brand-50 border border-brand-200 hover:bg-brand-100 transition-colors text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <p className="text-body-1 font-semibold text-neutral-500">
                Compartilhar Score do Dia
              </p>
              <p className="text-caption-1 text-neutral-400">
                Publique seu progresso de hoje com a galera.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              // Placeholder for future specific log sharing
              onOpenChange(false);
            }}
            className="w-full flex items-center p-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 transition-colors text-left opacity-70 cursor-not-allowed group"
            disabled
          >
            <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-neutral-400" />
            </div>
            <div>
              <p className="text-body-1 font-semibold text-neutral-500">
                Compartilhar Registro (Em breve)
              </p>
              <p className="text-caption-1 text-neutral-400">
                Escolha uma refeição ou treino específico.
              </p>
            </div>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
