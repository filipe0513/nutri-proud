'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { TeamFeedHeader } from '@/components/shared/TeamFeedHeader';
import { PostCard } from '@/components/shared/PostCard';
import { ShareToTeamDrawer } from '@/components/shared/ShareToTeamDrawer';
import { fetchTeamFeed, toggleReaction, createPost, fetchTeamDetails, updateTeamDetails, deleteTeamAction } from '@/store/api';
import type { PostWithAuthor, TeamSummary } from '@/types/teamTypes';
import { toast } from 'sonner';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/store';

export default function TeamFeedPage() {
  const params = useParams();
  const teamId = params.id as string;

  const router = useRouter();
  const currentUserId = useAppStore(state => state.user_profile?.id);
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchTeamDetails(teamId).then(setTeam),
      fetchTeamFeed(teamId).then(setPosts),
    ])
      .catch(() => toast.error('Erro ao carregar dados do time'))
      .finally(() => setIsLoading(false));
  }, [teamId]);

  const handleToggleReaction = async (postId: string, emoji: string) => {
    try {
      await toggleReaction(postId, emoji);
    } catch (err) {
       console.error(err);
       toast.error('Erro ao reagir');
    }
  };

  const handleCommentClick = () => {
    // Navigates to a specific post page (not implemented in this task)
    toast.info('Comentários em breve!');
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success('Publicação apagada.', {
      className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
    });
  };

  const handleShareScore = async (score: number) => {
    const loadingToast = toast.loading('Publicando score...');
    try {
      await createPost(teamId, { content: `Meu Score do Dia: ${score}/100! 🔥` });
      toast.success('Publicado com sucesso!', { id: loadingToast });
      // In a real app we'd fetch the new post and append it, or invalidate the cache
      // Here we just refresh the mock
      fetchTeamFeed(teamId).then(setPosts);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao publicar', { id: loadingToast });
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem('description') as HTMLInputElement).value.trim();
    if (!name) return;

    setIsUpdating(true);
    try {
      const updated = await updateTeamDetails(teamId, { name, description });
      setTeam(updated);
      setSettingsDrawerOpen(false);
      toast.success('Time atualizado com sucesso!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar time.';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async () => {
    setIsDeleting(true);
    try {
      await deleteTeamAction(teamId);
      toast.success('Time apagado com sucesso!');
      router.push('/teams');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao apagar time.';
      toast.error(msg);
      setIsDeleting(false);
    }
  };

  const isAdmin = team?.currentUserRole === 'ADMIN';

  return (
    <div className="min-h-screen bg-mesh-sunset flex flex-col relative pb-32">
      <TeamFeedHeader 
        title={isLoading ? 'Carregando...' : (team?.name ?? 'Time')} 
        onSettingsClick={isAdmin ? () => setSettingsDrawerOpen(true) : undefined}
      />
      
      <main className="flex-1 px-4 pt-6">
        {isLoading ? (
          <div className="flex justify-center mt-12">
            <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">👋</span>
            </div>
            <h2 className="text-title-3 font-semibold text-neutral-500">
              Nenhuma postagem ainda
            </h2>
            <p className="text-body-1 text-neutral-400 mt-2 max-w-[260px]">
              Seja o primeiro a compartilhar seu score com a galera!
            </p>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onToggleReaction={handleToggleReaction}
                onCommentClick={handleCommentClick}
                onDeletePost={handleDeletePost}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB - Floating Action Button */}
      <button
        onClick={() => setShareDrawerOpen(true)}
        className="fixed bottom-8 right-6 z-40 w-14 h-14 bg-gradient-fab shadow-lg shadow-brand-500/30 rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
        aria-label="Nova publicação"
      >
        <Plus className="w-7 h-7" />
      </button>

      <ShareToTeamDrawer
        open={shareDrawerOpen}
        onOpenChange={setShareDrawerOpen}
        onShareScore={handleShareScore}
      />

      {/* Settings Drawer */}
      <Drawer open={settingsDrawerOpen} onOpenChange={setSettingsDrawerOpen}>
        <DrawerContent className="!bg-white/95 backdrop-blur-2xl px-6 pb-10">
          <DrawerHeader className="px-0 pb-4">
            <DrawerTitle className="text-title-3 text-neutral-500">Configurações do Time</DrawerTitle>
          </DrawerHeader>
          <form onSubmit={handleUpdateTeam} className="space-y-4">
            <div>
              <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">
                Nome do Time
              </label>
              <Input name="name" defaultValue={team?.name} placeholder="Ex: Galera do Crossfit" className="h-12 bg-white/50" required data-testid="input-team-name" />
            </div>
            <div>
              <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">
                Descrição (Opcional)
              </label>
              <Input name="description" defaultValue={team?.description || ''} placeholder="Qual o foco do time?" className="h-12 bg-white/50" data-testid="input-team-description" />
            </div>
            <Button
              type="submit"
              disabled={isUpdating}
              data-testid="btn-save-team-settings"
              className="w-full h-14 text-button-1 rounded-2xl bg-brand-500 mt-2 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Salvando...</>
              ) : 'Salvar Alterações'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              data-testid="btn-open-delete-team-dialog"
              onClick={() => {
                setSettingsDrawerOpen(false);
                setDeleteConfirmOpen(true);
              }}
              className="w-full h-14 text-button-1 rounded-2xl text-notify-error hover:bg-notify-error-glass hover:text-notify-error"
            >
              Apagar Time
            </Button>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Drawer */}
      <Drawer open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DrawerContent className="!bg-white/95 backdrop-blur-2xl px-6 pb-8">
          <DrawerHeader className="px-0 pb-2 text-center">
            <DrawerTitle className="text-title-3 text-notify-error">Apagar Time</DrawerTitle>
          </DrawerHeader>
          <div className="text-center space-y-4 mt-2">
            <p className="text-body-1 text-neutral-500">
              Tem certeza que deseja apagar o time <strong>{team?.name}</strong>?
            </p>
            <p className="text-caption-1 text-neutral-400">
              Esta ação não pode ser desfeita e todos os membros perderão o acesso.
            </p>
          </div>
          <DrawerFooter className="px-0 pt-6 flex flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex-1 h-12 rounded-xl text-neutral-500 border-neutral-200"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteTeam}
              disabled={isDeleting}
              data-testid="btn-confirm-delete-team"
              className="flex-1 h-12 rounded-xl bg-notify-error hover:bg-notify-error/90 text-white"
            >
              {isDeleting ? 'Apagando...' : 'Sim, Apagar'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
