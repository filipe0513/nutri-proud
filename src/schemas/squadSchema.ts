import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────

export const squadRoleSchema = z.enum(['ADMIN', 'MEMBER']);

// ── Squad ──────────────────────────────────────────────────

export const createSquadSchema = z.object({
  name: z.string().min(2, 'O nome do squad deve ter pelo menos 2 caracteres.').max(60),
  description: z.string().max(300).optional(),
}).strict();

export const updateSquadSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(300).nullable().optional(),
}).strict();

// ── SquadMember ────────────────────────────────────────────

export const joinSquadSchema = z.object({
  inviteCode: z.string().uuid('Código de convite inválido.'),
}).strict();

export const updateSquadMemberSchema = z.object({
  role: squadRoleSchema.optional(),
  muteNotifications: z.boolean().optional(),
}).strict();

// ── Inferred Types ─────────────────────────────────────────

export type SquadRole = z.infer<typeof squadRoleSchema>;
export type CreateSquad = z.infer<typeof createSquadSchema>;
export type UpdateSquad = z.infer<typeof updateSquadSchema>;
export type JoinSquad = z.infer<typeof joinSquadSchema>;
export type UpdateSquadMember = z.infer<typeof updateSquadMemberSchema>;
