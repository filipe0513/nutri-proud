import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────

export const teamRoleSchema = z.enum(['ADMIN', 'MEMBER']);

// ── Team ──────────────────────────────────────────────────

export const createTeamSchema = z.object({
  name: z.string().min(2, 'O nome do team deve ter pelo menos 2 caracteres.').max(60),
  description: z.string().max(300).optional(),
}).strict();

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(300).nullable().optional(),
}).strict();

// ── TeamMember ────────────────────────────────────────────

export const joinTeamSchema = z.object({
  inviteCode: z.string().uuid('Código de convite inválido.'),
}).strict();

export const updateTeamMemberSchema = z.object({
  role: teamRoleSchema.optional(),
  muteNotifications: z.boolean().optional(),
}).strict();

// ── Inferred Types ─────────────────────────────────────────

export type TeamRole = z.infer<typeof teamRoleSchema>;
export type CreateTeam = z.infer<typeof createTeamSchema>;
export type UpdateTeam = z.infer<typeof updateTeamSchema>;
export type JoinTeam = z.infer<typeof joinTeamSchema>;
export type UpdateTeamMember = z.infer<typeof updateTeamMemberSchema>;
