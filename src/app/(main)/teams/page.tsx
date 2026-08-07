'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, KeyRound, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchMyTeams, createTeam, joinTeamByCode } from '@/store/api';
import type { TeamSummary } from '@/types/teamTypes';
import { toast } from 'sonner';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { TopHeader } from '@/components/shared/TopHeader';

export default function TeamsHubPage() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [joinDrawerOpen, setJoinDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchMyTeams()
      .then((data) => { if (!cancelled) setTeams(data); })
      .catch(() => { if (!cancelled) toast.error('Erro ao carregar times'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);



  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem('description') as HTMLInputElement).value.trim();
    if (!name) return;

    setIsCreating(true);
    try {
      const newTeam = await createTeam({ name, description: description || undefined });
      setTeams((prev) => [newTeam, ...prev]);
      setCreateDrawerOpen(false);
      toast.success(`Time "${newTeam.name}" criado! 🎉`, {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
    } catch {
      toast.error('Não foi possível criar o Time. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const inviteCode = (form.elements.namedItem('inviteCode') as HTMLInputElement).value.trim();
    if (!inviteCode) return;

    setIsJoining(true);
    try {
      const joined = await joinTeamByCode(inviteCode);
      setTeams((prev) => [joined, ...prev]);
      setJoinDrawerOpen(false);
      toast.success(`Você entrou no Time "${joined.name}"! 🎉`, {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Código inválido.';
      toast.error(msg);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center pt-24">
        <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 pt-24 pb-32">
      <TopHeader 
        leftAction="back" 
        title="Seus times" 
        rightElement={
          <button 
            onClick={() => setCreateDrawerOpen(true)}
            aria-label="Criar Novo Time"
            className="flex items-center justify-center bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-full w-10 h-10 hover:bg-glass-light-2 transition-all text-neutral-500 hover:text-brand-500 active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      {/* Content */}
      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-brand-500" />
          </div>
          <h2 className="text-title-2 font-bold text-neutral-500 mb-2">
            Nenhum Time ainda
          </h2>
          <p className="text-body-1 text-neutral-400 max-w-[280px] mb-8">
            Crie um time ou entre com um código para começar a compartilhar seus resultados.
          </p>
          <div className="flex flex-col w-full gap-3 max-w-sm">
            <Button
              onClick={() => setCreateDrawerOpen(true)}
              className="w-full h-14 text-button-1 rounded-2xl bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20"
            >
              <Plus className="w-5 h-5 mr-2" /> Criar Time
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
          <div className="grid gap-4">
            {teams.map((team) => (
              <div key={team.id} className="w-full bg-glass-light-1 backdrop-blur-sm border border-white/60 p-5 rounded-3xl shadow-sm">
                <button
                  onClick={() => router.push(`/teams/${team.id}`)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div>
                    <h3 className="text-title-3 font-bold text-neutral-500">{team.name}</h3>
                    {team.description && (
                      <p className="text-caption-1 text-neutral-400 mt-0.5 line-clamp-1">{team.description}</p>
                    )}
                    <p className="text-caption-1 text-neutral-400 mt-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {team.memberCount} membro{team.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors flex-shrink-0 ml-3">
                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-brand-500" />
                  </div>
                </button>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Drawer */}
      <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
        <DrawerContent className="!bg-white/95 backdrop-blur-2xl px-6 pb-10">
          <DrawerHeader className="px-0 pb-4">
            <DrawerTitle className="text-title-3 text-neutral-500">Criar Novo Time</DrawerTitle>
          </DrawerHeader>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">
                Nome do Time
              </label>
              <Input name="name" placeholder="Ex: Galera do Crossfit" className="h-12 bg-white/50" required />
            </div>
            <div>
              <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">
                Descrição (Opcional)
              </label>
              <Input name="description" placeholder="Qual o foco do time?" className="h-12 bg-white/50" />
            </div>
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full h-14 text-button-1 rounded-2xl bg-brand-500 mt-2 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Criando...</>
              ) : 'Criar'}
            </Button>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Join Drawer */}
      <Drawer open={joinDrawerOpen} onOpenChange={setJoinDrawerOpen}>
        <DrawerContent className="!bg-white/95 backdrop-blur-2xl px-6 pb-10">
          <DrawerHeader className="px-0 pb-4">
            <DrawerTitle className="text-title-3 text-neutral-500">Entrar em um Time</DrawerTitle>
          </DrawerHeader>
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">
                Código de Convite
              </label>
              <Input
                name="inviteCode"
                placeholder="Cole o código aqui"
                className="h-12 bg-white/50 text-center font-mono"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isJoining}
              className="w-full h-14 text-button-1 rounded-2xl bg-brand-500 mt-2 flex items-center justify-center gap-2"
            >
              {isJoining ? (
                <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Entrando...</>
              ) : 'Entrar'}
            </Button>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
