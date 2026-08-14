/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

vi.mock('@/lib/posthog-server', () => ({
  queryPostHog: vi.fn(),
}));

import {
  getPatientGoalAdherence,
  getBrokenStreaks,
  getTeamWeakestPillars,
  getSocialDisengagement,
  getInactivePatients,
} from '../dashboardInsightsService';

import { queryPostHog } from '@/lib/posthog-server';

const mockQueryPostHog = vi.mocked(queryPostHog);

// ─── Shared fixtures ──────────────────────────────────────────────────────────

/** Returns admin memberships for a nutritionist owning one team */
function mockAdminMemberships(nutriId: string, teamId: string, teamName: string) {
  return [{ teamId, userId: nutriId, role: 'ADMIN', team: { id: teamId, name: teamName } }];
}

/** Returns MEMBER rows for patients in a team */
function mockPatientMemberships(
  patients: { id: string; name: string; targets?: Record<string, number> }[],
  teamId: string,
) {
  return patients.map((p) => ({
    teamId,
    userId: p.id,
    role: 'MEMBER',
    user: { id: p.id, name: p.name, image: null, targets: p.targets ?? null },
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Scope isolation test (MOST CRITICAL) ────────────────────────────────────

describe('scope isolation', () => {
  it('nutri A cannot see patients from nutri B teams', async () => {
    const nutriA = 'nutri-a';
    const nutriB = 'nutri-b';
    const patientOfA = { id: 'pat-a', name: 'Alice' };
    const patientOfB = { id: 'pat-b', name: 'Bob' };

    // Nutri A is ADMIN in team-1
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships(nutriA, 'team-1', 'Team A') as any)
      .mockResolvedValueOnce(mockPatientMemberships([patientOfA], 'team-1') as any);
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([] as any);

    const resultA = await getPatientGoalAdherence(nutriA);
    expect(resultA.map((r) => r.id)).toEqual([patientOfA.id]);
    expect(resultA.map((r) => r.id)).not.toContain(patientOfB.id);

    vi.clearAllMocks();

    // Nutri B is ADMIN in team-2 — should only see patientOfB
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships(nutriB, 'team-2', 'Team B') as any)
      .mockResolvedValueOnce(mockPatientMemberships([patientOfB], 'team-2') as any);
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([] as any);

    const resultB = await getPatientGoalAdherence(nutriB);
    expect(resultB.map((r) => r.id)).toEqual([patientOfB.id]);
    expect(resultB.map((r) => r.id)).not.toContain(patientOfA.id);
  });
});

// ─── getPatientGoalAdherence ─────────────────────────────────────────────────

describe('getPatientGoalAdherence', () => {
  it('returns empty array when nutri has no teams', async () => {
    prismaMock.teamMember.findMany.mockResolvedValueOnce([] as any);
    const result = await getPatientGoalAdherence('nutri-1');
    expect(result).toEqual([]);
  });

  it('computes correct water adherence % for a patient who hit the goal', async () => {
    // Arrange: 30-day range; patient has target 2000ml; logged 2000ml on 15 days
    const from = new Date();
    from.setDate(from.getDate() - 30);

    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships('nutri-1', 'team-1', 'T1') as any)
      .mockResolvedValueOnce(
        mockPatientMemberships(
          [{ id: 'pat-1', name: 'Alice', targets: { water_ml_per_day: 2000 } }],
          'team-1',
        ) as any,
      );

    // 15 distinct days with primaryValue >= 2000
    const logs = Array.from({ length: 15 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (i + 1));
      return { userId: 'pat-1', category: 'water', primaryValue: 2000, eventTime: d };
    });
    prismaMock.dailyLog.findMany.mockResolvedValueOnce(logs as any);

    // Act
    const result = await getPatientGoalAdherence('nutri-1');

    // Assert: 15/30 = 50%
    expect(result).toHaveLength(1);
    expect(result[0].waterAdherencePct).toBe(50);
    expect(result[0].sleepAdherencePct).toBeNull(); // no sleep target set
  });

  it('returns null adherence for patients without targets', async () => {
    // Arrange
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships('nutri-1', 'team-1', 'T1') as any)
      .mockResolvedValueOnce(
        mockPatientMemberships([{ id: 'pat-1', name: 'Alice', targets: undefined }], 'team-1') as any,
      );
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([] as any);

    // Act
    const result = await getPatientGoalAdherence('nutri-1');

    // Assert: no targets → both null (no crash)
    expect(result[0].waterAdherencePct).toBeNull();
    expect(result[0].sleepAdherencePct).toBeNull();
  });
});

// ─── getBrokenStreaks ─────────────────────────────────────────────────────────

describe('getBrokenStreaks', () => {
  it('includes patient with no recent log (streak broken)', async () => {
    // Arrange
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships('nutri-1', 't1', 'T1') as any)
      .mockResolvedValueOnce(
        mockPatientMemberships([{ id: 'pat-stale', name: 'Stale' }], 't1') as any,
      );

    // Last log was 5 days ago
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 5);
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([
      { userId: 'pat-stale', eventTime: staleDate },
    ] as any);

    // Act
    const result = await getBrokenStreaks('nutri-1');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pat-stale');
    expect(result[0].daysSinceLastLog).toBeGreaterThanOrEqual(4);
  });

  it('excludes patient who logged today', async () => {
    // Arrange
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships('nutri-1', 't1', 'T1') as any)
      .mockResolvedValueOnce(
        mockPatientMemberships([{ id: 'pat-active', name: 'Active' }], 't1') as any,
      );

    // Last log is today
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([
      { userId: 'pat-active', eventTime: new Date() },
    ] as any);

    // Act
    const result = await getBrokenStreaks('nutri-1');

    // Assert
    expect(result).toHaveLength(0);
  });
});

// ─── getTeamWeakestPillars ────────────────────────────────────────────────────

describe('getTeamWeakestPillars', () => {
  it('ranks pillar with zero logs as weakest (rank 1)', async () => {
    // Arrange
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships('nutri-1', 't1', 'T1') as any)
      .mockResolvedValueOnce(
        mockPatientMemberships([{ id: 'pat-1', name: 'Alice' }], 't1') as any,
      );

    // Only water logs present — sleep, food, workout, poop have 0
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([
      { category: 'water' },
      { category: 'water' },
      { category: 'food' },
    ] as any);

    // Act
    const result = await getTeamWeakestPillars('nutri-1');

    // Assert: pillars with 0 logs come first
    const zeroCount = result.filter((r) => r.logCount === 0);
    expect(zeroCount.length).toBeGreaterThanOrEqual(1);
    // rank 1 must be a pillar with 0 logs
    expect(result[0].logCount).toBe(0);
    expect(result[0].rank).toBe(1);
  });

  it('returns all 5 pillars even when nutri has no patients', async () => {
    // Arrange: nutri with no teams
    prismaMock.teamMember.findMany.mockResolvedValueOnce([] as any);

    // Act
    const result = await getTeamWeakestPillars('nutri-1');

    // Assert
    expect(result).toHaveLength(5);
    result.forEach((r) => expect(r.logCount).toBe(0));
  });
});

// ─── getSocialDisengagement ───────────────────────────────────────────────────

describe('getSocialDisengagement', () => {
  it('includes patient whose last comment is older than the window', async () => {
    // Arrange
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships('nutri-1', 't1', 'T1') as any)
      .mockResolvedValueOnce(
        mockPatientMemberships([{ id: 'pat-quiet', name: 'Quiet' }], 't1') as any,
      );

    // No recent activity (within 7 days)
    prismaMock.reaction.findMany.mockResolvedValueOnce([] as any);
    prismaMock.comment.findMany.mockResolvedValueOnce([] as any);

    // Last engagement was 10 days ago
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    prismaMock.reaction.findMany.mockResolvedValueOnce([] as any);
    prismaMock.comment.findMany.mockResolvedValueOnce([
      { userId: 'pat-quiet', createdAt: oldDate },
    ] as any);

    // Act
    const result = await getSocialDisengagement('nutri-1', 7);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pat-quiet');
    expect(result[0].daysSinceLastEngagement).toBeGreaterThanOrEqual(9);
  });

  it('excludes patient who reacted within the window', async () => {
    // Arrange
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships('nutri-1', 't1', 'T1') as any)
      .mockResolvedValueOnce(
        mockPatientMemberships([{ id: 'pat-active', name: 'Active' }], 't1') as any,
      );

    // Recent reaction within 7 days
    prismaMock.reaction.findMany.mockResolvedValueOnce([
      { userId: 'pat-active', createdAt: new Date() },
    ] as any);
    prismaMock.comment.findMany.mockResolvedValueOnce([] as any);

    // Act
    const result = await getSocialDisengagement('nutri-1', 7);

    // Assert
    expect(result).toHaveLength(0);
  });
});

// ─── getInactivePatients ──────────────────────────────────────────────────────

describe('getInactivePatients', () => {
  it('returns patients not seen in PostHog within the window', async () => {
    // Arrange
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships('nutri-1', 't1', 'T1') as any)
      .mockResolvedValueOnce(
        mockPatientMemberships([
          { id: 'pat-inactive', name: 'Gone' },
          { id: 'pat-active', name: 'Here' },
        ], 't1') as any,
      );

    // PostHog: pat-active was seen today; pat-inactive was seen 10 days ago
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    mockQueryPostHog.mockResolvedValueOnce([
      ['pat-active', new Date().toISOString()],
      ['pat-inactive', oldDate.toISOString()],
    ] as any);

    // Act
    const result = await getInactivePatients('nutri-1', 7);

    // Assert
    expect(result.map((r) => r.id)).toContain('pat-inactive');
    expect(result.map((r) => r.id)).not.toContain('pat-active');
  });

  it('returns empty array when PostHog is unavailable (graceful degradation)', async () => {
    // Arrange
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships('nutri-1', 't1', 'T1') as any)
      .mockResolvedValueOnce(
        mockPatientMemberships([{ id: 'pat-1', name: 'Alice' }], 't1') as any,
      );

    mockQueryPostHog.mockRejectedValueOnce(new Error('PostHog down'));

    // Act
    const result = await getInactivePatients('nutri-1', 7);

    // Assert: no false alerts when PostHog is down
    expect(result).toEqual([]);
  });

  it('treats patient never seen in PostHog as inactive', async () => {
    // Arrange
    prismaMock.teamMember.findMany
      .mockResolvedValueOnce(mockAdminMemberships('nutri-1', 't1', 'T1') as any)
      .mockResolvedValueOnce(
        mockPatientMemberships([{ id: 'pat-ghost', name: 'Ghost' }], 't1') as any,
      );

    // PostHog returns no rows for this patient
    mockQueryPostHog.mockResolvedValueOnce([] as any);

    // Act
    const result = await getInactivePatients('nutri-1', 7);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pat-ghost');
    expect(result[0].daysSinceLastSeen).toBe(999);
  });
});
