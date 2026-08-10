/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

vi.mock('@/services/notificationService', () => ({
  dispatchNotification: vi.fn().mockResolvedValue({ success: true }),
  notifyTeamAdmins: vi.fn().mockResolvedValue(undefined),
}));

import {
  getPostComments,
  createComment,
  deleteComment,
  getNutriFeed,
  getPatientRadar,
} from '../teamService';

describe('teamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Comments ──────────────────────────────────────────────────────────────

  describe('getPostComments', () => {
    it('should return comments for a post the user has access to', async () => {
      prismaMock.post.findUnique.mockResolvedValue({ teamId: 'team1' } as any);
      prismaMock.teamMember.findUnique.mockResolvedValue({ id: 'tm1' } as any);
      prismaMock.comment.findMany.mockResolvedValue([
        {
          id: 'c1',
          text: 'Great post!',
          createdAt: new Date('2024-01-01'),
          user: { id: 'u1', name: 'Alice', image: null },
        },
      ] as any);

      const result = await getPostComments('post1', 'user1');

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Great post!');
      expect(result[0].author.name).toBe('Alice');
    });

    it('should throw if post not found', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null as any);
      await expect(getPostComments('invalid', 'user1')).rejects.toThrow('Post nao encontrado.');
    });

    it('should throw if user is not a team member', async () => {
      prismaMock.post.findUnique.mockResolvedValue({ teamId: 'team1' } as any);
      prismaMock.teamMember.findUnique.mockResolvedValue(null as any);
      await expect(getPostComments('post1', 'user1')).rejects.toThrow('Acesso negado.');
    });
  });

  describe('createComment', () => {
    it('should create a comment and return it', async () => {
      prismaMock.post.findUnique.mockResolvedValue({ teamId: 'team1', authorId: 'other-user' } as any);
      prismaMock.teamMember.findUnique.mockResolvedValue({ id: 'tm1', role: 'MEMBER' } as any);
      prismaMock.comment.create.mockResolvedValue({
        id: 'c1',
        text: 'Nice!',
        createdAt: new Date('2024-01-01'),
        user: { id: 'user1', name: 'Bob', image: null },
      } as any);

      const result = await createComment('post1', 'user1', 'Nice!');

      expect(result.text).toBe('Nice!');
      expect(result.author.name).toBe('Bob');
      expect(prismaMock.comment.create).toHaveBeenCalled();
    });

    it('should throw if user is not a team member', async () => {
      prismaMock.post.findUnique.mockResolvedValue({ teamId: 'team1', authorId: 'u2' } as any);
      prismaMock.teamMember.findUnique.mockResolvedValue(null as any);
      await expect(createComment('post1', 'user1', 'text')).rejects.toThrow('Acesso negado.');
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment by the author', async () => {
      prismaMock.comment.findUnique.mockResolvedValue({ id: 'c1', userId: 'user1' } as any);
      prismaMock.comment.delete.mockResolvedValue({ id: 'c1' } as any);

      await deleteComment('c1', 'user1');
      expect(prismaMock.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('should throw if not the author', async () => {
      prismaMock.comment.findUnique.mockResolvedValue({ id: 'c1', userId: 'other' } as any);
      await expect(deleteComment('c1', 'user1')).rejects.toThrow('Acesso negado');
    });
  });

  // ─── getNutriFeed ──────────────────────────────────────────────────────────

  describe('getNutriFeed', () => {
    it('should return empty array when nutri has no teams', async () => {
      prismaMock.teamMember.findMany.mockResolvedValue([]);
      const result = await getNutriFeed('nutri1');
      expect(result).toEqual([]);
    });

    it('should merge social and system posts sorted by date', async () => {
      prismaMock.teamMember.findMany.mockResolvedValue([
        { teamId: 't1', team: { name: 'Team A' } },
      ] as any);

      prismaMock.post.findMany.mockResolvedValue([
        {
          id: 'p1',
          content: 'Hello',
          imageUrl: null,
          type: 'USER_GENERATED',
          teamId: 't1',
          createdAt: new Date('2024-01-02'),
          author: { id: 'u1', name: 'Alice', image: null },
          reactions: [],
          _count: { comments: 0 },
        },
      ] as any);

      prismaMock.teamFeedPost.findMany.mockResolvedValue([
        {
          id: 'fp1',
          type: 'MILESTONE',
          content: 'First log!',
          createdAt: new Date('2024-01-03'),
          teamId: 't1',
          patient: { id: 'u2', name: 'Bob', image: null },
          metadata: null,
        },
      ] as any);

      const result = await getNutriFeed('nutri1');

      expect(result).toHaveLength(2);
      // Most recent first (system post Jan 3, then social post Jan 2)
      expect(result[0].kind).toBe('system');
      expect(result[1].kind).toBe('social');
    });
  });

  // ─── getPatientRadar ──────────────────────────────────────────────────────

  describe('getPatientRadar', () => {
    it('should return empty when no teams', async () => {
      prismaMock.teamMember.findMany.mockResolvedValueOnce([] as any);
      const result = await getPatientRadar('nutri1');
      expect(result).toEqual({ atRisk: [], doingGreat: [] });
    });

    it('should classify patients as at_risk or doing_great', async () => {
      // First call: admin memberships
      prismaMock.teamMember.findMany.mockResolvedValueOnce([
        { teamId: 't1', team: { name: 'Team A' } },
      ] as any);

      // Second call: all members in those teams (no role filter)
      prismaMock.teamMember.findMany.mockResolvedValueOnce([
        { user: { id: 'patient1', name: 'At Risk', image: null }, teamId: 't1' },
        { user: { id: 'patient2', name: 'Star', image: null }, teamId: 't1' },
      ] as any);

      // patient1: no log → at_risk
      prismaMock.dailyLog.findFirst.mockResolvedValueOnce(null as any);
      prismaMock.dailyLog.findMany.mockResolvedValueOnce([] as any);

      // patient2: recent log, high score → doing_great
      prismaMock.dailyLog.findFirst.mockResolvedValueOnce({
        eventTime: new Date(),
      } as any);
      prismaMock.dailyLog.findMany.mockResolvedValueOnce([
        { primaryValue: 90 },
        { primaryValue: 85 },
      ] as any);

      const result = await getPatientRadar('nutri1');

      expect(result.atRisk).toHaveLength(1);
      expect(result.atRisk[0].patient.name).toBe('At Risk');
      expect(result.doingGreat).toHaveLength(1);
      expect(result.doingGreat[0].patient.name).toBe('Star');
    });
  });
});
