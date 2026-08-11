'use client';

import { useState } from 'react';
import { PostCard } from '@/components/shared/PostCard';
import { CommentsDrawer } from '@/components/shared/CommentsDrawer';
import { toggleReaction } from '@/store/api';
import { Bell, Trophy, AlertTriangle, Activity, BarChart2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRelativeTime } from '@/utils/timeUtils';
import type { UnifiedFeedItem, TeamFeedPostWithPatient, EvolutionMetadata } from '@/types/teamTypes';
import { LogDetailsDrawer } from '@/components/shared/LogDetailsDrawer';

interface NutriFeedClientProps {
  items: UnifiedFeedItem[];
  currentUserId: string;
}

type FilterType = 'all' | 'social' | 'ALERT' | 'MILESTONE' | 'EVOLUTION' | 'CHALLENGE_SUMMARY';

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'ALERT', label: 'Alertas' },
  { value: 'MILESTONE', label: 'Conquistas' },
  { value: 'social', label: 'Posts' },
  { value: 'EVOLUTION', label: 'Evolucao' },
  { value: 'CHALLENGE_SUMMARY', label: 'Desafio' },
];

function getSystemIconConfig(type: string) {
  switch (type) {
    case 'MILESTONE':
      return { icon: Trophy, bg: 'bg-green-100', color: 'text-green-600' };
    case 'ALERT':
      return { icon: AlertTriangle, bg: 'bg-red-100', color: 'text-red-600' };
    case 'EVOLUTION':
      return { icon: Activity, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'CHALLENGE_SUMMARY':
      return { icon: BarChart2, bg: 'bg-orange-100', color: 'text-notify-warning' };
    default:
      return { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-600' };
  }
}

export function NutriFeedClient({ items, currentUserId }: NutriFeedClientProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [detailPost, setDetailPost] = useState<TeamFeedPostWithPatient | null>(null);

  const filtered = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'social') return item.kind === 'social';
    return item.kind === 'system' && item.feedPost.type === filter;
  });

  return (
    <>
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-caption-1 font-semibold whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-brand-500 text-white'
                : 'bg-white/60 text-neutral-500 border border-neutral-200/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed items */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bell className="h-12 w-12 text-neutral-200 mb-4" />
          <p className="text-body-2 text-neutral-400">Nenhum item encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            if (item.kind === 'social') {
              return (
                <div key={`social-${item.post.id}`}>
                  <div className="mb-1 px-1">
                    <span className="text-caption-2 text-neutral-400 bg-white/60 px-2 py-0.5 rounded-full">
                      {item.teamName}
                    </span>
                  </div>
                  <PostCard
                    post={item.post}
                    currentUserId={currentUserId}
                    onToggleReaction={(postId, emoji) => toggleReaction(postId, emoji)}
                    onCommentClick={(postId) => setCommentPostId(postId)}
                  />
                </div>
              );
            }

            // System feed post
            const fp = item.feedPost;
            const { icon: Icon, bg, color } = getSystemIconConfig(fp.type);
            const patientName = fp.patient.name || 'Paciente';

            return (
              <div
                key={`system-${fp.id}`}
                className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm flex items-start gap-4 cursor-pointer hover:bg-neutral-50 active:scale-[0.98] transition-all"
                onClick={() => setDetailPost(fp)}
              >
                <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-5 w-5">
                      {fp.patient.image && (
                        <AvatarImage src={fp.patient.image} alt={patientName} referrerPolicy="no-referrer" />
                      )}
                      <AvatarFallback className="bg-brand-100 text-brand-500 text-[10px] font-bold">
                        {patientName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-body-2 font-medium text-neutral-600 truncate">{patientName}</span>
                    <span className="text-caption-1 text-neutral-400 shrink-0">
                      {getRelativeTime(fp.createdAt)}
                    </span>
                  </div>
                  <p className="text-body-1 text-neutral-500">{fp.content}</p>
                  {fp.type === 'EVOLUTION' && (fp.metadata as EvolutionMetadata)?.caption && (
                    <p className="text-caption-1 text-neutral-400 mt-1 line-clamp-2">
                      {(fp.metadata as EvolutionMetadata).caption}
                    </p>
                  )}
                  <span className="text-caption-2 text-neutral-400 mt-1 inline-block">
                    {fp.teamName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CommentsDrawer
        postId={commentPostId}
        open={!!commentPostId}
        onOpenChange={(open) => !open && setCommentPostId(null)}
      />

      <LogDetailsDrawer
        kind="system"
        feedPost={detailPost}
        open={!!detailPost}
        onOpenChange={(open) => !open && setDetailPost(null)}
      />
    </>
  );
}
