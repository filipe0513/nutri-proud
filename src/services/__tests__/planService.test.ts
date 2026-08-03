import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canCreateGroup, canInvitePatient, PLAN_LIMITS, getPlanUsage } from '../planService';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    teamMember: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('planService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canCreateGroup', () => {
    it('returns true if plan is PRO', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'PRO' } as never);

      const result = await canCreateGroup('user-id');
      expect(result).toBe(true);
      expect(prisma.teamMember.count).not.toHaveBeenCalled();
    });

    it('returns false if FREE limit is reached', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'FREE' } as never);
      vi.mocked(prisma.teamMember.count).mockResolvedValue(1);

      const result = await canCreateGroup('user-id');
      expect(result).toBe(false);
      expect(prisma.teamMember.count).toHaveBeenCalledWith({
        where: { userId: 'user-id', role: 'ADMIN' },
      });
    });

    it('returns true if FREE limit is not reached', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'FREE' } as never);
      vi.mocked(prisma.teamMember.count).mockResolvedValue(0);

      const result = await canCreateGroup('user-id');
      expect(result).toBe(true);
    });
  });

  describe('canInvitePatient', () => {
    it('returns true if plan is PRO', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'PRO' } as never);

      const result = await canInvitePatient('user-id');
      expect(result).toBe(true);
    });

    it('returns false if FREE limit is reached', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'FREE' } as never);
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([{ teamId: 'team-1' }] as never);
      vi.mocked(prisma.teamMember.count).mockResolvedValue(5);

      const result = await canInvitePatient('user-id');
      expect(result).toBe(false);
    });

    it('returns true if FREE limit is not reached', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'FREE' } as never);
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([{ teamId: 'team-1' }] as never);
      vi.mocked(prisma.teamMember.count).mockResolvedValue(4);

      const result = await canInvitePatient('user-id');
      expect(result).toBe(true);
    });

    it('returns true if user has no groups', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'FREE' } as never);
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

      const result = await canInvitePatient('user-id');
      expect(result).toBe(true);
      expect(prisma.teamMember.count).not.toHaveBeenCalled();
    });
  });

  describe('getPlanUsage', () => {
    it('returns correct usage data for FREE plan', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'FREE' } as never);
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([{ teamId: 'team-1' }] as never);
      vi.mocked(prisma.teamMember.count).mockResolvedValue(2);

      const result = await getPlanUsage('user-id');
      
      expect(result.plan).toBe('FREE');
      expect(result.groups.current).toBe(1);
      expect(result.groups.limit).toBe(PLAN_LIMITS.FREE.groups);
      expect(result.patients.current).toBe(2);
      expect(result.patients.limit).toBe(PLAN_LIMITS.FREE.patients);
    });
  });
});
