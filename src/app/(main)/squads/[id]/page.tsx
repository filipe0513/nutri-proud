'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { SquadFeedHeader } from '@/components/shared/SquadFeedHeader';
import { PostCard } from '@/components/shared/PostCard';
import { ShareToSquadDrawer } from '@/components/shared/ShareToSquadDrawer';
import { fetchSquadFeed, toggleReaction, createPost } from '@/store/api';
import type { PostWithAuthor } from '@/types/squadTypes';
import { toast } from 'sonner';

export default function SquadFeedPage() {
  const params = useParams();
  const squadId = params.id as string;

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);

  useEffect(() => {
    fetchSquadFeed(squadId)
      .then(setPosts)
      .catch(() => toast.error('Erro ao carregar feed'))
      .finally(() => setIsLoading(false));
  }, [squadId]);

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

  const handleShareScore = async (score: number) => {
    const loadingToast = toast.loading('Publicando score...');
    try {
      await createPost(squadId, { content: `Meu Score do Dia: ${score}/100! 🔥` });
      toast.success('Publicado com sucesso!', { id: loadingToast });
      // In a real app we'd fetch the new post and append it, or invalidate the cache
      // Here we just refresh the mock
      fetchSquadFeed(squadId).then(setPosts);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao publicar', { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-mesh-sunset flex flex-col relative pb-32">
      <SquadFeedHeader title="Squad Feed" />
      
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
                onToggleReaction={handleToggleReaction}
                onCommentClick={handleCommentClick}
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

      <ShareToSquadDrawer
        open={shareDrawerOpen}
        onOpenChange={setShareDrawerOpen}
        onShareScore={handleShareScore}
      />
    </div>
  );
}
