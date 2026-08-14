/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

import {
  getActivationRateByNutritionist,
  getPatientRetentionByNutritionist,
  getPlanDistributionAndUpgrades,
  getNutritionistEngagementRanking,
} from '../adminNutriService';

// RBAC (role !== ADMIN → 403) is enforced in the route handler
// (src/app/api/admin/nutritionists-metrics/route.ts), not the service layer.
// Route-level RBAC follows the same pattern as adminPatientsService.

const FIXED_RANGE = {
  from: '2026-07-01T00:00:00.000Z',
  to: '2026-08-14T23:59:59.000Z',
};

/** Factory for a single TeamMember ADMIN record with nested team.members */
function makeAdminMembership(
  nutriId: string,
  nutriName: string,
  patients: Array<{ userId: string; joinedAt: Date }>,
) {
  return {
    userId: nutriId,
    user: { name: nutriName, email: `${nutriName.toLowerCase()}@test.com` },
    team: { members: patients.map((p) => ({ userId: p.userId, joinedAt: p.joinedAt })) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getActivationRateByNutritionist ──────────────────────────────────────────

describe('getActivationRateByNutritionist', () => {
  it('returns 40% when 4 of 10 patients logged within the first 7 days', async () => {
    const joinBase = new Date('2026-07-10T00:00:00.000Z');

    // 10 patients — p1…p10
    const patients = Array.from({ length: 10 }, (_, i) => ({
      userId: `p${i + 1}`,
      joinedAt: new Date(joinBase.getTime()),
    }));

    // Arrange: one nutritionist with 10 patients
    prismaMock.teamMember.findMany.mockResolvedValueOnce([
      makeAdminMembership('n1', 'Nutri Ana', patients),
    ] as any);

    // 4 patients log within 7 days of joinBase (≤ joinBase + 7d)
    const within7Days = new Date(joinBase.getTime() + 3 * 24 * 60 * 60 * 1000); // +3d
    const after7Days = new Date(joinBase.getTime() + 8 * 24 * 60 * 60 * 1000); // +8d
    const logRows = [
      { userId: 'p1', eventTime: within7Days },
      { userId: 'p2', eventTime: within7Days },
      { userId: 'p3', eventTime: within7Days },
      { userId: 'p4', eventTime: within7Days },
      // p5–p10 log after 7 days
      { userId: 'p5', eventTime: after7Days },
      { userId: 'p6', eventTime: after7Days },
    ];

    prismaMock.dailyLog.findMany.mockResolvedValueOnce(logRows as any);

    // Act
    const result = await getActivationRateByNutritionist(FIXED_RANGE);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].nutriId).toBe('n1');
    expect(result[0].invited).toBe(10);
    expect(result[0].activated).toBe(4);
    expect(result[0].activationRatePct).toBe(40);
  });

  it('returns 0% when no patients are in the range', async () => {
    prismaMock.teamMember.findMany.mockResolvedValueOnce([
      makeAdminMembership('n1', 'Nutri Ana', []),
    ] as any);

    const result = await getActivationRateByNutritionist(FIXED_RANGE);

    expect(result[0].invited).toBe(0);
    expect(result[0].activationRatePct).toBe(0);
    // dailyLog should not be queried when there are no patients
    expect(prismaMock.dailyLog.findMany).not.toHaveBeenCalled();
  });
});

// ─── getPatientRetentionByNutritionist ────────────────────────────────────────

describe('getPatientRetentionByNutritionist', () => {
  it('counts only patients with logs in the last N days as retained', async () => {
    const patients = [
      { userId: 'p1', joinedAt: new Date('2026-06-01T00:00:00.000Z') },
      { userId: 'p2', joinedAt: new Date('2026-06-01T00:00:00.000Z') },
      { userId: 'p3', joinedAt: new Date('2026-06-01T00:00:00.000Z') },
      { userId: 'p4', joinedAt: new Date('2026-06-01T00:00:00.000Z') },
      { userId: 'p5', joinedAt: new Date('2026-06-01T00:00:00.000Z') },
    ];

    prismaMock.teamMember.findMany.mockResolvedValueOnce([
      makeAdminMembership('n1', 'Nutri Bia', patients),
    ] as any);

    // Only p1, p2, p3 have recent logs (3 of 5 → 60%)
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([
      { userId: 'p1' },
      { userId: 'p2' },
      { userId: 'p3' },
    ] as any);

    const result = await getPatientRetentionByNutritionist(30);

    expect(result).toHaveLength(1);
    expect(result[0].totalPatients).toBe(5);
    expect(result[0].retainedPatients).toBe(3);
    expect(result[0].retentionPct).toBe(60);
  });

  it('returns 0% for a nutritionist with no patients', async () => {
    prismaMock.teamMember.findMany.mockResolvedValueOnce([
      makeAdminMembership('n1', 'Nutri Bia', []),
    ] as any);

    const result = await getPatientRetentionByNutritionist(30);

    expect(result[0].totalPatients).toBe(0);
    expect(result[0].retentionPct).toBe(0);
    expect(prismaMock.dailyLog.findMany).not.toHaveBeenCalled();
  });
});

// ─── getPlanDistributionAndUpgrades ──────────────────────────────────────────

describe('getPlanDistributionAndUpgrades', () => {
  it('returns correct count per plan and signals no upgrade history', async () => {
    // Two nutritionists: one FREE, one PRO
    prismaMock.teamMember.findMany.mockResolvedValueOnce([
      { userId: 'n1' },
      { userId: 'n2' },
    ] as any);

    (prismaMock.user.groupBy as any).mockResolvedValueOnce([
      { plan: 'FREE', _count: { plan: 1 } },
      { plan: 'PRO', _count: { plan: 1 } },
    ] as any);

    const result = await getPlanDistributionAndUpgrades();

    expect(result.upgradeHistoryAvailable).toBe(false);
    expect(result.distribution).toHaveLength(2);

    const freeEntry = result.distribution.find((d) => d.plan === 'FREE');
    const proEntry = result.distribution.find((d) => d.plan === 'PRO');
    expect(freeEntry?.count).toBe(1);
    expect(proEntry?.count).toBe(1);
  });

  it('returns empty distribution when no nutritionists exist', async () => {
    prismaMock.teamMember.findMany.mockResolvedValueOnce([] as any);

    const result = await getPlanDistributionAndUpgrades();

    expect(result.distribution).toHaveLength(0);
    expect(result.upgradeHistoryAvailable).toBe(false);
    expect(prismaMock.user.groupBy).not.toHaveBeenCalled();
  });
});

// ─── getNutritionistEngagementRanking ────────────────────────────────────────

describe('getNutritionistEngagementRanking', () => {
  it('sorts nutritionists descending by avg logs per patient', async () => {
    // Nutri A: 2 patients (p1=10 logs, p2=5 logs) → avg 7.5
    // Nutri B: 3 patients (p3=3, p4=2, p5=1 logs) → avg 2.0
    const nutriAPatients = [
      { userId: 'p1', joinedAt: new Date('2026-06-01T00:00:00.000Z') },
      { userId: 'p2', joinedAt: new Date('2026-06-01T00:00:00.000Z') },
    ];
    const nutriBPatients = [
      { userId: 'p3', joinedAt: new Date('2026-06-01T00:00:00.000Z') },
      { userId: 'p4', joinedAt: new Date('2026-06-01T00:00:00.000Z') },
      { userId: 'p5', joinedAt: new Date('2026-06-01T00:00:00.000Z') },
    ];

    prismaMock.teamMember.findMany.mockResolvedValueOnce([
      makeAdminMembership('nA', 'Nutri Alice', nutriAPatients),
      makeAdminMembership('nB', 'Nutri Bruno', nutriBPatients),
    ] as any);

    (prismaMock.dailyLog.groupBy as any).mockResolvedValueOnce([
      { userId: 'p1', _count: { userId: 10 } },
      { userId: 'p2', _count: { userId: 5 } },
      { userId: 'p3', _count: { userId: 3 } },
      { userId: 'p4', _count: { userId: 2 } },
      { userId: 'p5', _count: { userId: 1 } },
    ] as any);

    const result = await getNutritionistEngagementRanking();

    expect(result).toHaveLength(2);
    // First entry must be the highest avg
    expect(result[0].nutriId).toBe('nA');
    expect(result[0].avgLogsPerPatient).toBe(7.5);
    expect(result[1].nutriId).toBe('nB');
    expect(result[1].avgLogsPerPatient).toBe(2.0);
  });

  it('handles nutritionists with no patients (avgLogsPerPatient = 0)', async () => {
    prismaMock.teamMember.findMany.mockResolvedValueOnce([
      makeAdminMembership('n1', 'Nutri Carlos', []),
    ] as any);

    const result = await getNutritionistEngagementRanking();

    expect(result[0].avgLogsPerPatient).toBe(0);
    expect(prismaMock.dailyLog.groupBy).not.toHaveBeenCalled();
  });
});
