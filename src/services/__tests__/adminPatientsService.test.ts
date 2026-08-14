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

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import {
  getRetentionByCohort,
  getAnonymousConversionRate,
  getLogsDistributionByPillar,
  getAvgLogsPerActiveUser,
  getOnboardingFunnel,
} from '../adminPatientsService';
import { queryPostHog } from '@/lib/posthog-server';
import { auth } from '@/auth';

const mockQueryPostHog = vi.mocked(queryPostHog);
const mockAuth = vi.mocked(auth);

const FIXED_RANGE = {
  from: '2026-07-01T00:00:00.000Z',
  to: '2026-08-14T23:59:59.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getRetentionByCohort ─────────────────────────────────────────────────────

describe('getRetentionByCohort', () => {
  it('returns two cohorts with correct retention percentages', async () => {
    // Arrange: 2 users in week 33 (2026-08-10), 1 user in week 34 (2026-08-17)
    const weekA = '2026-08-11T00:00:00.000Z'; // W33
    const weekB = '2026-08-17T00:00:00.000Z'; // W34

    prismaMock.user.findMany.mockResolvedValueOnce([
      { id: 'u1', createdAt: new Date(weekA) },
      { id: 'u2', createdAt: new Date(weekA) },
      { id: 'u3', createdAt: new Date(weekB) },
    ] as any);

    // u1 logged in W33 (offset 0) and W34 (offset 1)
    // u2 logged only in W34 (offset 1)
    // u3 logged in W34 (offset 0)
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([
      { userId: 'u1', eventTime: new Date('2026-08-11T10:00:00.000Z') }, // W33
      { userId: 'u1', eventTime: new Date('2026-08-18T10:00:00.000Z') }, // W34
      { userId: 'u2', eventTime: new Date('2026-08-18T10:00:00.000Z') }, // W34
      { userId: 'u3', eventTime: new Date('2026-08-17T10:00:00.000Z') }, // W34
    ] as any);

    // Act
    const cohorts = await getRetentionByCohort(FIXED_RANGE);

    // Assert
    expect(cohorts).toHaveLength(2);

    const cohortW33 = cohorts.find((c) => c.cohortWeek === '2026-W33');
    expect(cohortW33?.cohortSize).toBe(2);
    // offset 0 (W33): only u1 logged → 50%
    expect(cohortW33?.weekRetention[0]).toEqual({ weekOffset: 0, retainedPct: 50 });
    // offset 1 (W34): both u1 and u2 logged → 100%
    expect(cohortW33?.weekRetention[1]).toEqual({ weekOffset: 1, retainedPct: 100 });

    const cohortW34 = cohorts.find((c) => c.cohortWeek === '2026-W34');
    expect(cohortW34?.cohortSize).toBe(1);
    // offset 0 (W34): u3 logged → 100%
    expect(cohortW34?.weekRetention[0]).toEqual({ weekOffset: 0, retainedPct: 100 });
  });
});

// ─── getAnonymousConversionRate ───────────────────────────────────────────────

describe('getAnonymousConversionRate', () => {
  it('returns 25% when 4 anon sessions and 1 real login exist', async () => {
    // Arrange
    prismaMock.systemEvent.count
      .mockResolvedValueOnce(4)  // AUTH_ANONYMOUS_SUCCESS
      .mockResolvedValueOnce(1); // AUTH_LOGIN_SUCCESS

    // Act
    const result = await getAnonymousConversionRate(FIXED_RANGE);

    // Assert
    expect(result.anonSessions).toBe(4);
    expect(result.realLogins).toBe(1);
    expect(result.conversionRatePct).toBe(25);
  });

  it('returns 0% when there are no anonymous sessions', async () => {
    // Arrange
    prismaMock.systemEvent.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    // Act
    const result = await getAnonymousConversionRate(FIXED_RANGE);

    // Assert
    expect(result.conversionRatePct).toBe(0);
  });
});

// ─── getLogsDistributionByPillar ──────────────────────────────────────────────

describe('getLogsDistributionByPillar', () => {
  it('includes pillar with zero logs in the result', async () => {
    // Arrange: only water and food have logs — poop is absent from DB result
    (prismaMock.dailyLog.groupBy as any).mockResolvedValueOnce([
      { category: 'water', _count: { category: 10 } },
      { category: 'food', _count: { category: 5 } },
      // sleep, workout, poop intentionally missing
    ] as any);

    // Act
    const result = await getLogsDistributionByPillar(FIXED_RANGE);

    // Assert
    expect(result).toHaveLength(5);

    const poop = result.find((r) => r.pillar === 'poop');
    expect(poop?.count).toBe(0);
    expect(poop?.pct).toBe(0);

    const water = result.find((r) => r.pillar === 'water');
    expect(water?.count).toBe(10);
    // total = 15, water = 10 → 67%
    expect(water?.pct).toBe(67);
  });
});

// ─── getAvgLogsPerActiveUser ──────────────────────────────────────────────────

describe('getAvgLogsPerActiveUser', () => {
  it('excludes users with no logs in the range from the denominator', async () => {
    // Arrange: only 2 active users — u1 (3 logs) and u2 (7 logs)
    // u3 has no logs in range so groupBy does not return it
    (prismaMock.dailyLog.groupBy as any).mockResolvedValueOnce([
      { userId: 'u1', _count: { userId: 3 } },
      { userId: 'u2', _count: { userId: 7 } },
    ] as any);

    // Act
    const result = await getAvgLogsPerActiveUser(FIXED_RANGE);

    // Assert
    expect(result.activeUsers).toBe(2);
    expect(result.totalLogs).toBe(10);
    expect(result.avg).toBe(5.0);
  });

  it('returns avg 0 when no users are active', async () => {
    (prismaMock.dailyLog.groupBy as any).mockResolvedValueOnce([] as any);

    const result = await getAvgLogsPerActiveUser(FIXED_RANGE);

    expect(result.activeUsers).toBe(0);
    expect(result.avg).toBe(0);
  });
});

// ─── getOnboardingFunnel ──────────────────────────────────────────────────────

describe('getOnboardingFunnel', () => {
  it('returns correct step counts and drop-off rates from PostHog + DB', async () => {
    // Arrange: PostHog returns 100 welcome views, 60 onboarding views
    mockQueryPostHog
      .mockResolvedValueOnce([[100]] as any) // welcome
      .mockResolvedValueOnce([[60]] as any); // onboarding

    // DB returns 30 users with at least 1 log
    (prismaMock.dailyLog.groupBy as any).mockResolvedValueOnce(
      Array.from({ length: 30 }, (_, i) => ({ userId: `u${i}` })) as any,
    );

    // Act
    const funnel = await getOnboardingFunnel(FIXED_RANGE);

    // Assert
    expect(funnel).toHaveLength(3);

    const welcome = funnel.find((s) => s.step === 'welcome')!;
    expect(welcome.count).toBe(100);
    expect(welcome.dropOffPct).toBeNull();

    const onboarding = funnel.find((s) => s.step === 'onboarding')!;
    expect(onboarding.count).toBe(60);
    // drop-off: (100 - 60) / 100 = 40%
    expect(onboarding.dropOffPct).toBe(40);

    const firstLog = funnel.find((s) => s.step === 'first_log')!;
    expect(firstLog.count).toBe(30);
    // drop-off: (60 - 30) / 60 = 50%
    expect(firstLog.dropOffPct).toBe(50);
  });

  it('returns zero counts and no errors when PostHog is unavailable', async () => {
    // Arrange: PostHog throws
    mockQueryPostHog.mockRejectedValue(new Error('PostHog down'));

    (prismaMock.dailyLog.groupBy as any).mockResolvedValueOnce([{ userId: 'u1' }] as any);

    // Act
    const funnel = await getOnboardingFunnel(FIXED_RANGE);

    // Assert — should not throw, welcome and onboarding are 0
    expect(funnel[0].count).toBe(0); // welcome
    expect(funnel[1].count).toBe(0); // onboarding
    expect(funnel[2].count).toBe(1); // first_log from DB still works
  });
});

// ─── RBAC: GET /api/admin/patients-metrics ────────────────────────────────────

describe('GET /api/admin/patients-metrics — RBAC', () => {
  it('returns 403 when the caller is not ADMIN', async () => {
    // Arrange: authenticated as a regular USER
    mockAuth.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER' },
    } as any);

    const { GET } = await import('@/app/api/admin/patients-metrics/route');
    const req = new Request('http://localhost/api/admin/patients-metrics');

    // Act
    const res = await GET(req);

    // Assert
    expect(res.status).toBe(403);
  });

  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValueOnce(null as any);

    const { GET } = await import('@/app/api/admin/patients-metrics/route');
    const req = new Request('http://localhost/api/admin/patients-metrics');

    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});
