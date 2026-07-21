'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, KeyRound, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchMySquads } from '@/store/api';
import type { SquadSummary } from '@/types/squadTypes';
import { toast } from 'sonner';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';

export default function SquadsHubPage() {
  const [squads, setSquads] = useState<SquadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [joinDrawerOpen, setJoinDrawerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchMySquads()
      .then(setSquads)
      .catch(() => toast.error('Erro ao carregar squads'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreateSquad = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateDrawerOpen(false);
    toast.success('Squad criado! (Mock)');
    // Refresh list logic would go here
  };

  const handleJoinSquad = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setJoinDrawerOpen(false);
    toast.success('Entrou no Squad! (Mock)');
    // Refresh list logic would go here
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center pt-24"><div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-32">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-title-1 font-bold text-neutral-500 mb-2">Squads</h1>
        <p className="text-body-1 text-neutral-400">
          Compartilhe sua jornada com amigos.
        </p>
      </header>

      {/* Content */}
      {squads.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-16 text-center">
          <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-brand-500" />
          </div>
          <h2 className="text-title-2 font-bold text-neutral-500 mb-2">
            Nenhum Squad ainda
          </h2>
          <p className="text-body-1 text-neutral-400 max-w-[280px] mb-8">
            Crie um grupo ou entre com um código para começar a compartilhar seus resultados.
          </p>
          <div className="flex flex-col w-full gap-3 max-w-sm">
            <Button
              onClick={() => setCreateDrawerOpen(true)}
              className="w-full h-14 text-button-1 rounded-2xl bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20"
            >
              <Plus className="w-5 h-5 mr-2" /> Criar Squad
            </Button>
            <Button
              variant="outline"
              onClick={() => setJoinDrawerOpen(true)}
              className="w-full h-14 text-button-1 rounded-2xl border-2 border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            >
              <KeyRound className="w-5 h-5 mr-2" /> Entrar com Código
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-title-3 font-semibold text-neutral-500">Seus Grupos</h2>
             <Button variant="ghost" size="sm" onClick={() => setCreateDrawerOpen(true)} className="text-brand-500 hover:text-brand-600 hover:bg-brand-50">
               + Novo
             </Button>
          </div>
          <div className="grid gap-4">
            {squads.map((squad) => (
              <button
                key={squad.id}
                onClick={() => router.push(`/squads/${squad.id}`)}
                className="w-full bg-glass-light-1 backdrop-blur-sm border border-white/60 p-5 rounded-3xl flex items-center justify-between text-left hover:bg-white/40 transition-colors shadow-sm group"
              >
                <div>
                  <h3 className="text-title-3 font-bold text-neutral-500">{squad.name}</h3>
                  <p className="text-caption-1 text-neutral-400 mt-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {squad.memberCount} membro{squad.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                   <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-brand-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Drawer */}
      <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
        <DrawerContent className="!bg-white/95 backdrop-blur-2xl px-6 pb-10">
          <DrawerHeader className="px-0 pb-4">
            <DrawerTitle className="text-title-3 text-neutral-500">Criar Novo Squad</DrawerTitle>
          </DrawerHeader>
          <form onSubmit={handleCreateSquad} className="space-y-4">
            <div>
              <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">Nome do Grupo</label>
              <Input placeholder="Ex: Galera do Crossfit" className="h-12 bg-white/50" required />
            </div>
            <div>
              <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">Descrição (Opcional)</label>
              <Input placeholder="Qual o foco do grupo?" className="h-12 bg-white/50" />
            </div>
            <Button type="submit" className="w-full h-14 text-button-1 rounded-2xl bg-brand-500 mt-2">
              Criar
            </Button>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Join Drawer */}
      <Drawer open={joinDrawerOpen} onOpenChange={setJoinDrawerOpen}>
        <DrawerContent className="!bg-white/95 backdrop-blur-2xl px-6 pb-10">
          <DrawerHeader className="px-0 pb-4">
            <DrawerTitle className="text-title-3 text-neutral-500">Entrar em um Squad</DrawerTitle>
          </DrawerHeader>
          <form onSubmit={handleJoinSquad} className="space-y-4">
            <div>
              <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">Código de Convite</label>
              <Input placeholder="Ex: 8f2a-4bc1" className="h-12 bg-white/50 text-center font-mono" required />
            </div>
            <Button type="submit" className="w-full h-14 text-button-1 rounded-2xl bg-brand-500 mt-2">
              Entrar
            </Button>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
