import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────

export const postTypeSchema = z.enum(['USER_GENERATED', 'SYSTEM_MILESTONE']);

// ── Post ───────────────────────────────────────────────────

export const createPostSchema = z.object({
  content: z.string().max(2000).optional(),
  imageUrl: z.string().url('URL de imagem inválida.').max(2048).optional(),
  squadId: z.string().uuid('ID do squad inválido.'),
}).strict().refine(
  (data) => data.content || data.imageUrl,
  { message: 'O post deve conter texto ou imagem.' },
);

// ── Reaction ───────────────────────────────────────────────

export const createReactionSchema = z.object({
  emoji: z.string().min(1, 'Emoji é obrigatório.').max(8),
  postId: z.string().uuid('ID do post inválido.'),
}).strict();

// ── Comment ────────────────────────────────────────────────

export const createCommentSchema = z.object({
  text: z.string().min(1, 'O comentário não pode estar vazio.').max(1000),
  postId: z.string().uuid('ID do post inválido.'),
}).strict();

// ── Inferred Types ─────────────────────────────────────────

export type PostType = z.infer<typeof postTypeSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type CreateReaction = z.infer<typeof createReactionSchema>;
export type CreateComment = z.infer<typeof createCommentSchema>;
