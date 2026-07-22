'use client';

import { useEffect, useState } from 'react';
import { Users, ChevronRight, Loader2, Plus } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { fetchMySquads } from '@/store/api';
import type { SquadSummary } from '@/types/squadTypes';
import { useRouter } from 'next/navigation';

interface SquadPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user taps "Publicar" on a specific squad */
  onSelectSquad: (squadId: string, squadName: string) => void;
  /** Whether the parent is currently uploading / processing */
  isPublishing: boolean;
  /** The squadId currently being published to (for button loading state) */
  publishingSquadId: string | null;
}

export function SquadPickerModal({
  open,
  onOpenChange,
  onSelectSquad,
  isPublishing,
  publishingSquadId,
}: SquadPickerModalProps) {
  const router = useRouter();
  const [squads, setSquads] = useState<SquadSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchMySquads()
      .then((data) => { if (!cancelled) setSquads(data); })
      .catch(() => { if (!cancelled) setSquads([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);



  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!bg-white/97 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
        <DrawerHeader className="px-0 pb-4">
          <DrawerTitle className="text-title-3 text-neutral-500 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" />
            Publicar em qual Squad?
          </DrawerTitle>
          <p className="text-caption-1 text-neutral-400 mt-1">
            Seu card de progresso será publicado no feed do Squad escolhido.
          </p>
        </DrawerHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
          </div>
        ) : squads.length === 0 ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-brand-400" />
            </div>
            <div>
              <p className="text-body-1 font-semibold text-neutral-500">
                Você ainda não tem Squads
              </p>
              <p className="text-caption-1 text-neutral-400 mt-1 max-w-[240px] mx-auto">
                Crie ou entre em um Squad para compartilhar seu progresso com amigos.
              </p>
            </div>
            <Button
              className="h-12 rounded-2xl bg-brand-500 text-white text-button-1 px-6 flex items-center gap-2"
              onClick={() => {
                onOpenChange(false);
                router.push('/squads');
              }}
            >
              <Plus className="w-4 h-4" />
              Ir para Squads
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {squads.map((squad) => {
              const isThisPublishing = isPublishing && publishingSquadId === squad.id;
              return (
                <button
                  key={squad.id}
                  type="button"
                  disabled={isPublishing}
                  onClick={() => onSelectSquad(squad.id, squad.name)}
                  className="w-full flex items-center p-4 rounded-2xl bg-brand-50 border border-brand-200 hover:bg-brand-100 active:scale-[0.98] transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {/* Squad avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-white text-lg font-bold">
                      {squad.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-body-1 font-semibold text-neutral-500 truncate">
                      {squad.name}
                    </p>
                    <p className="text-caption-1 text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" />
                      {squad.memberCount} membro{squad.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center ml-3 flex-shrink-0 group-hover:bg-brand-500/20 transition-colors">
                    {isThisPublishing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-brand-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
