'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle } from 'lucide-react';
import { getRelativeTime } from '@/utils/timeUtils';
import type { PostWithAuthor } from '@/types/squadTypes';
import { cn } from '@/lib/utils';
import { Droplets, Utensils, Dumbbell, Moon, Smile } from 'lucide-react';

interface PostCardProps {
  post: PostWithAuthor;
  onToggleReaction: (postId: string, emoji: string) => void;
  onCommentClick: (postId: string) => void;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function PostCard({ post, onToggleReaction, onCommentClick }: PostCardProps) {
  // Temporary state for optimistic UI (if needed, though real app uses react-query or similar)
  const [reactions, setReactions] = useState(post.reactions);

  const handleReaction = (emoji: string) => {
    onToggleReaction(post.id, emoji);
    // Optimistic update
    setReactions((prev) =>
      prev.map((r) => {
        if (r.emoji === emoji) {
          return {
            ...r,
            count: r.reacted ? r.count - 1 : r.count + 1,
            reacted: !r.reacted,
          };
        }
        return r;
      })
    );
  };

  return (
    <article className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-[2rem] p-5 shadow-sm mb-4">
      {/* Header */}
      <header className="flex items-center space-x-3 mb-4">
        <Link href={`/profile/${post.author.id}`}>
          <Avatar className="size-10 shadow-sm border border-white hover:scale-105 transition-transform cursor-pointer">
            {post.author.image && (
              <AvatarImage
                src={post.author.image}
                alt={post.author.name || 'Avatar'}
                referrerPolicy="no-referrer"
              />
            )}
            <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-400 text-white font-bold text-caption-1">
              {getInitials(post.author.name)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-body-1 font-semibold text-neutral-500 truncate">
            {post.author.name || 'Usuário'}
          </p>
          <p className="text-caption-1 text-neutral-400">
            {getRelativeTime(post.createdAt)}
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="mb-4">
        {post.content && (
          <p className="text-body-1 text-neutral-500 whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}
        {post.imageUrl && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-white/20 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt="Imagem do post" className="w-full h-auto object-cover max-h-[400px]" loading="lazy" />
          </div>
        )}
        {/* Render a fake score visualization if it's a score post (heuristic) */}
        {post.content?.includes('Score do Dia') && (
            <div className="mt-4 flex justify-between px-2 py-3 bg-white/40 rounded-2xl border border-white/50">
               {[
                  { icon: Droplets, color: 'var(--color-cat-water)' },
                  { icon: Utensils, color: 'var(--color-cat-food)' },
                  { icon: Dumbbell, color: 'var(--color-cat-workout)' },
                  { icon: Moon, color: 'var(--color-cat-sleep)' },
                  { icon: Smile, color: 'var(--color-cat-poop)' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                  </div>
                ))}
            </div>
        )}
      </div>

      {/* Footer */}
      <footer className="flex items-center space-x-2 pt-2 border-t border-white/30">
        <div className="flex items-center space-x-2 flex-1">
          {reactions.map((reaction) => (
            <button
              key={reaction.emoji}
              onClick={() => handleReaction(reaction.emoji)}
              className={cn(
                "flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors",
                reaction.reacted
                  ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                  : "bg-white/40 text-neutral-500 hover:bg-white/60 border border-transparent"
              )}
            >
              <span className="text-base leading-none">{reaction.emoji}</span>
              <span className="text-caption-1 font-semibold">{reaction.count}</span>
            </button>
          ))}
          {reactions.length === 0 && (
             <button
              onClick={() => handleReaction('🔥')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/40 text-neutral-500 hover:bg-white/60 transition-colors border border-transparent"
            >
              <span className="text-base leading-none">🔥</span>
            </button>
          )}
        </div>

        <button
          onClick={() => onCommentClick(post.id)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/40 text-neutral-500 hover:bg-white/60 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-caption-1 font-semibold">{post.commentCount}</span>
        </button>
      </footer>
    </article>
  );
}
