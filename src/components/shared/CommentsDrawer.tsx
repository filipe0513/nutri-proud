'use client';

import { useState, useEffect, useRef } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { getRelativeTime } from '@/utils/timeUtils';
import { fetchPostComments, createPostComment } from '@/store/api';
import type { CommentWithAuthor } from '@/types/teamTypes';

interface CommentsDrawerProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommentsDrawer({ postId, open, onOpenChange }: CommentsDrawerProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;
    const load = async () => {
      const result = await fetchPostComments(postId);
      if (!cancelled) {
        setComments(result);
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open, postId]);

  const handleSend = async () => {
    if (!text.trim() || !postId || sending) return;
    setSending(true);
    try {
      await createPostComment(postId, text.trim());
      setText('');
      const refreshed = await fetchPostComments(postId);
      setComments(refreshed);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      });
    } catch {
      // Error handled by fetchApiOrThrow
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!bg-glass-light-3 backdrop-blur-lg border-t border-white/40 rounded-t-[32px] px-4 pb-6 max-h-[70vh]">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-title-3 text-neutral-500">
            Comentarios ({comments.length})
          </DrawerTitle>
        </DrawerHeader>

        {/* Comments list */}
        <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[40vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-caption-1 text-neutral-400 py-8">
              Nenhum comentario ainda. Seja o primeiro!
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  {c.author.image && (
                    <AvatarImage src={c.author.image} alt={c.author.name ?? ''} referrerPolicy="no-referrer" />
                  )}
                  <AvatarFallback className="bg-brand-100 text-brand-500 text-caption-2 font-bold">
                    {(c.author.name ?? '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-body-2 font-semibold text-neutral-500 truncate">
                      {c.author.name ?? 'Usuario'}
                    </span>
                    <span className="text-caption-2 text-neutral-400 shrink-0">
                      {getRelativeTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-body-2 text-neutral-500 mt-0.5 break-words">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 items-end">
          <textarea
            className="flex-1 min-h-[44px] max-h-[100px] rounded-2xl border border-neutral-200/60 bg-white/80 px-4 py-3 text-input-1 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            placeholder="Escreva um comentario..."
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
      </DrawerContent>
    </Drawer>
  );
}
