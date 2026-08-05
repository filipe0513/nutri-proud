'use client';

import { TopHeader } from '@/components/shared/TopHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileCalendar } from '@/components/shared/ProfileCalendar';
import { PostCard } from '@/components/shared/PostCard';
import { toggleReaction } from '@/store/api';
import type { PostWithAuthor } from '@/types/teamTypes';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  scoresByDate: Record<string, number>;
  initialPosts: PostWithAuthor[];
  evolutionLogs?: { id: string; event_time: string; details: { photo_url: string; weight_kg: number } }[];
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

export function ProfileClient({ user, scoresByDate, initialPosts, evolutionLogs, isMe }: ProfileClientProps) {
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

        {/* Evolution Gallery */}
        {evolutionLogs && evolutionLogs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-title-3 font-semibold text-neutral-500">
                Evolução
              </h3>
              <span className="text-caption-2 text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
                {evolutionLogs.length} {evolutionLogs.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 px-2 snap-x hide-scrollbar">
              {evolutionLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="min-w-[140px] w-[140px] snap-center bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm rounded-2xl overflow-hidden flex flex-col shrink-0"
                >
                  <div className="relative aspect-[3/4] bg-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={log.details.photo_url} 
                      alt="Evolução" 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 text-white font-bold leading-none">
                      {log.details.weight_kg} <span className="text-[10px] opacity-80">kg</span>
                    </div>
                  </div>
                  <div className="p-2 bg-white/50 flex items-center justify-center gap-1.5 text-neutral-500">
                    <Calendar className="h-3 w-3 opacity-70" />
                    <span className="text-[10px] font-medium uppercase">
                      {format(new Date(log.event_time), "MMM d", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
                  ? 'Compartilhe seu progresso com o team para ver suas postagens aqui.'
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
