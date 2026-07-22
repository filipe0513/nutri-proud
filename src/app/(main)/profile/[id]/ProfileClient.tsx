'use client';

import { TopHeader } from '@/components/shared/TopHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileCalendar } from '@/components/shared/ProfileCalendar';
import { PostCard } from '@/components/shared/PostCard';
import { toggleReaction } from '@/store/api';
import type { PostWithAuthor } from '@/types/squadTypes';
import { toast } from 'sonner';

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  scoresByDate: Record<string, number>;
  initialPosts: PostWithAuthor[];
  isMe: boolean;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ProfileClient({ user, scoresByDate, initialPosts, isMe }: ProfileClientProps) {
  const posts = initialPosts;

  const handleToggleReaction = async (postId: string, emoji: string) => {
    try {
      await toggleReaction(postId, emoji);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao reagir');
    }
  };

  const handleCommentClick = () => {
    toast.info('Comentários em breve!');
  };

  return (
    <div className="min-h-screen bg-mesh-sunset flex flex-col relative pb-32">
      {/* Top Header */}
      <TopHeader leftAction="back" title={isMe ? 'Meu Perfil' : 'Perfil do Usuário'} rightAction="none" />
      
      <main className="flex-1 px-4 pt-24 max-w-xl mx-auto w-full">
        {/* User Info */}
        <section className="flex flex-col items-center mb-8">
          <Avatar className="w-24 h-24 shadow-md border-4 border-white mb-4">
            {user.image && (
              <AvatarImage
                src={user.image}
                alt={user.name || 'Avatar'}
                referrerPolicy="no-referrer"
              />
            )}
            <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-400 text-white font-bold text-title-2">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-title-2 font-bold text-neutral-500">
            {user.name || 'Usuário'}
          </h2>
        </section>

        {/* Heatmap Calendar */}
        <section className="mb-8">
          <ProfileCalendar scoresByDate={scoresByDate} />
        </section>

        {/* Visual Separator */}
        <div className="h-px bg-white/40 w-full mb-8 shadow-sm"></div>

        {/* Personal Feed */}
        <section>
          <h3 className="text-title-3 font-semibold text-neutral-500 mb-4 px-2">
            Timeline
          </h3>
          
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 text-center">
              <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <span className="text-3xl">📝</span>
              </div>
              <h4 className="text-body-1 font-semibold text-neutral-500">
                Nenhuma postagem ainda
              </h4>
              <p className="text-body-2 text-neutral-400 mt-1 max-w-[240px]">
                {isMe
                  ? 'Compartilhe seu progresso com o squad para ver suas postagens aqui.'
                  : 'Este usuário ainda não fez nenhuma publicação.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
        </section>
      </main>
      
      {/* Hide bottom navigation via global css or styling if necessary.
          The requirement says "A página de perfil não deve exibir a Bottom Nav". 
          We can solve this globally if BottomNav checks the path or we use a layout. 
          Usually layout.tsx controls it. Let's make sure our layout handles it or we hide it here. */}
      <style dangerouslySetInnerHTML={{ __html: `
        #bottom-nav { display: none !important; }
      `}} />
    </div>
  );
}
