import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────

export const teamRoleSchema = z.enum(['ADMIN', 'MEMBER']);

// ── Shared invite code format ──────────────────────────────
// 4–20 alphanumeric chars (case-insensitive input — normalized to uppercase at service layer).
export const inviteCodeSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9]{4,20}$/,
    'Código deve ter 4–20 caracteres alfanuméricos, sem espaços ou acentos.',
  );

// ── Team ──────────────────────────────────────────────────

export const createTeamSchema = z.object({
  name: z.string().min(2, 'O nome do team deve ter pelo menos 2 caracteres.').max(60),
  description: z.string().max(300).optional(),
  inviteCode: inviteCodeSchema.optional(),
}).strict();

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(300).nullable().optional(),
}).strict();

// ── TeamMember ────────────────────────────────────────────

export const joinTeamSchema = z.object({
  // Accepts both legacy UUIDs and custom alphanumeric codes.
  inviteCode: z.string().min(1, 'O código é obrigatório.'),
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
export type InviteCode = z.infer<typeof inviteCodeSchema>;
