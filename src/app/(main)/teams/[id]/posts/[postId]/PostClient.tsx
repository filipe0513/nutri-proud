'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { TeamFeedHeader } from '@/components/shared/TeamFeedHeader';
import { PostCard } from '@/components/shared/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { fetchPost, fetchPostComments, createPostComment, toggleReaction } from '@/store/api';
import { useAppStore } from '@/store/store';
import { getRelativeTime } from '@/utils/timeUtils';
import type { PostWithAuthor, CommentWithAuthor } from '@/types/teamTypes';
import { toast } from 'sonner';

export function PostClient() {
  const params = useParams();
  const postId = params.postId as string;

  const currentUserId = useAppStore((state) => state.user_profile?.id);
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    Promise.all([fetchPost(postId), fetchPostComments(postId)])
      .then(([p, c]) => {
        setPost(p);
        setComments(c);
      })
      .catch(() => toast.error('Erro ao carregar post.'))
      .finally(() => setIsLoading(false));
  }, [postId]);

  const handleToggleReaction = async (pid: string, emoji: string) => {
    try {
      await toggleReaction(pid, emoji);
    } catch {
      toast.error('Erro ao reagir');
    }
  };

  const handleCommentClick = () => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDeletePost = () => {
    window.history.back();
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await createPostComment(postId, text.trim());
      setText('');
      const refreshed = await fetchPostComments(postId);
      setComments(refreshed);
      setPost((prev) => (prev ? { ...prev, commentCount: refreshed.length } : prev));
    } catch {
      toast.error('Erro ao comentar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh-sunset flex flex-col pb-28">
      <TeamFeedHeader title="Post" />

      <main className="flex-1 px-4 pt-6 max-w-xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center mt-12">
            <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : !post ? (
          <p className="text-center text-body-1 text-neutral-400 mt-12">
            Post não encontrado.
          </p>
        ) : (
          <>
            <PostCard
              post={post}
              currentUserId={currentUserId}
              onToggleReaction={handleToggleReaction}
              onCommentClick={handleCommentClick}
              onDeletePost={handleDeletePost}
            />

            {/* Comments */}
            <section className="mt-2 bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-[2rem] p-5 shadow-sm mb-4">
              <h2 className="text-title-3 font-semibold text-neutral-500 mb-4">
                Comentários ({comments.length})
              </h2>

              {comments.length === 0 ? (
                <p className="text-body-1 text-neutral-400 text-center py-6">
                  Nenhum comentário ainda. Seja o primeiro!
                </p>
              ) : (
                <div className="divide-y divide-white/30">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        {c.author.image && (
                          <AvatarImage
                            src={c.author.image}
                            alt={c.author.name ?? ''}
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <AvatarFallback className="bg-brand-100 text-brand-500 text-caption-2 font-bold">
                          {(c.author.name ?? '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-body-2 font-semibold text-neutral-500 truncate">
                            {c.author.name ?? 'Usuário'}
                          </span>
                          <span className="text-caption-2 text-neutral-400 shrink-0">
                            {getRelativeTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-body-2 text-neutral-500 mt-0.5 break-words">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Fixed comment input */}
      {!isLoading && post && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-glass-light-2 backdrop-blur-md border-t border-white/40 px-4 py-3">
          <div className="flex gap-2 items-end max-w-xl mx-auto">
            <textarea
              ref={inputRef}
              className="flex-1 min-h-[44px] max-h-[100px] rounded-2xl border border-neutral-200/60 bg-white/80 px-4 py-3 text-input-1 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              placeholder="Escreva um comentário..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              size="icon"
              className="h-11 w-11 rounded-full bg-brand-500 hover:bg-brand-600 shrink-0"
              onClick={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Spacer so content isn't hidden under the fixed input */}
      <div className="h-20" />
    </div>
  );
}
