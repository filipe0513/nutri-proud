/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

vi.mock('@/services/progressService', () => ({
  getWeeklyProgress: vi.fn().mockResolvedValue([
    { score: 80, isFuture: false, isToday: false },
    { score: 75, isFuture: false, isToday: false },
    { score: 90, isFuture: false, isToday: false },
    { score: null, isFuture: false, isToday: true },
    { score: null, isFuture: true, isToday: false },
    { score: null, isFuture: true, isToday: false },
    { score: null, isFuture: true, isToday: false },
  ]),
}));

import { getPatientContext } from '../patientContextService';

describe('patientContextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return patient context with defaults when user has no targets', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      targets: null,
      profile: null,
    } as any);

    prismaMock.dailyLog.findMany.mockResolvedValue([]);

    const ctx = await getPatientContext('user1');

    expect(ctx.waterGoalMl).toBe(2500);
    expect(ctx.sleepGoalHours).toBe(8);
    expect(ctx.workoutGoalPerWeek).toBe(3);
    expect(ctx.mealsGoalPerDay).toBe(3);
    expect(ctx.mainGoal).toBe('health');
    expect(ctx.todayLogs).toEqual([]);
    expect(ctx.last30Logs).toEqual([]);
  });

  it('should compute water metrics from today logs', async () => {
    const now = new Date();
    prismaMock.user.findUnique.mockResolvedValue({
      targets: { water_ml_per_day: 2000 },
      profile: { main_goal: 'fat_loss' },
    } as any);

    prismaMock.dailyLog.findMany.mockResolvedValue([
      { category: 'water', primaryValue: 50, eventTime: now },
      { category: 'water', primaryValue: 30, eventTime: now },
      { category: 'food', primaryValue: 80, eventTime: now },
    ] as any);

    const ctx = await getPatientContext('user1');

    expect(ctx.waterGoalMl).toBe(2000);
    expect(ctx.waterPctToday).toBe(80); // 50 + 30
    expect(ctx.waterMlToday).toBe(1600); // 80% of 2000
    expect(ctx.mealsToday).toBe(1);
    expect(ctx.mainGoal).toBe('fat_loss');
  });

  it('should compute currentStreak from weekly progress', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ targets: null, profile: null } as any);
    prismaMock.dailyLog.findMany.mockResolvedValue([]);

    const ctx = await getPatientContext('user1');

    // From our mock: 3 completed days with scores 80, 75, 90 (all >= 70)
    expect(ctx.currentStreak).toBe(3);
    expect(ctx.yesterdayScore).toBe(90);
  });
});
