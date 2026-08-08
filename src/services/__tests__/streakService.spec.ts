import { expect, test, vi, beforeEach, afterEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { calculateDailyStreak, calculateWorkoutWeeklyStreak } from '../streakService';

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

beforeEach(() => {
  // Fix "now" to 2026-06-10 15:00 UTC (12:00 São Paulo)
  vi.setSystemTime(new Date('2026-06-10T15:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

function makeLog(eventTime: string, primaryValue: number, category = 'WATER') {
  return {
    id: crypto.randomUUID(),
    userId: 'user-1',
    category,
    primaryValue,
    details: {},
    eventTime: new Date(eventTime),
    source: 'UNKNOWN',
    createdAt: new Date(eventTime),
  };
}

// ── calculateDailyStreak ──────────────────────────────────────────────

test('returns 0 when no logs exist', async () => {
  prismaMock.dailyLog.findMany.mockResolvedValue([]);
  const result = await calculateDailyStreak('user-1', 'water');
  expect(result).toBe(0);
});

test('returns streak of 3 for 3 consecutive qualifying days before today', async () => {
  // Today is June 10 — check from June 9 backwards
  prismaMock.dailyLog.findMany.mockResolvedValue([
    makeLog('2026-06-09T14:00:00Z', 80),
    makeLog('2026-06-08T14:00:00Z', 90),
    makeLog('2026-06-07T14:00:00Z', 75),
  ]);

  const result = await calculateDailyStreak('user-1', 'water');
  expect(result).toBe(3);
});

test('breaks streak when primaryValue is below threshold', async () => {
  prismaMock.dailyLog.findMany.mockResolvedValue([
    makeLog('2026-06-09T14:00:00Z', 80),
    makeLog('2026-06-08T14:00:00Z', 50), // below 70 threshold
    makeLog('2026-06-07T14:00:00Z', 90),
  ]);

  const result = await calculateDailyStreak('user-1', 'water');
  expect(result).toBe(1);
});

test('breaks streak on missing day', async () => {
  prismaMock.dailyLog.findMany.mockResolvedValue([
    makeLog('2026-06-09T14:00:00Z', 80),
    // June 8 missing
    makeLog('2026-06-07T14:00:00Z', 90),
  ]);

  const result = await calculateDailyStreak('user-1', 'water');
  expect(result).toBe(1);
});

test('picks max primaryValue per day when multiple logs exist', async () => {
  prismaMock.dailyLog.findMany.mockResolvedValue([
    makeLog('2026-06-09T10:00:00Z', 50),
    makeLog('2026-06-09T18:00:00Z', 80), // higher value same day
  ]);

  const result = await calculateDailyStreak('user-1', 'water');
  expect(result).toBe(1);
});

// ── calculateWorkoutWeeklyStreak ──────────────────────────────────────

test('returns 0 when user not found', async () => {
  prismaMock.user.findUnique.mockResolvedValue(null);
  const result = await calculateWorkoutWeeklyStreak('user-1', 3);
  expect(result).toBe(0);
});

test('returns 0 when no workout logs exist', async () => {
  prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' } as never);
  prismaMock.dailyLog.findMany.mockResolvedValue([]);
  const result = await calculateWorkoutWeeklyStreak('user-1', 3);
  expect(result).toBe(0);
});

test('counts consecutive completed weeks (skipping current week)', async () => {
  // June 10 2026 is a Wednesday → current week W24
  // W23: June 1-7 (need 3 workouts)
  // W22: May 25-31 (need 3 workouts)
  prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' } as never);
  prismaMock.dailyLog.findMany.mockResolvedValue([
    // Current week (W24) — should be skipped
    makeLog('2026-06-08T14:00:00Z', 1, 'WORKOUT'),
    // W23: 3 workouts
    makeLog('2026-06-01T14:00:00Z', 1, 'WORKOUT'),
    makeLog('2026-06-02T14:00:00Z', 1, 'WORKOUT'),
    makeLog('2026-06-03T14:00:00Z', 1, 'WORKOUT'),
    // W22: 3 workouts
    makeLog('2026-05-25T14:00:00Z', 1, 'WORKOUT'),
    makeLog('2026-05-26T14:00:00Z', 1, 'WORKOUT'),
    makeLog('2026-05-27T14:00:00Z', 1, 'WORKOUT'),
  ]);

  const result = await calculateWorkoutWeeklyStreak('user-1', 3);
  expect(result).toBe(2);
});

test('breaks weekly streak when target not met', async () => {
  prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' } as never);
  prismaMock.dailyLog.findMany.mockResolvedValue([
    // W23: 3 workouts — meets target
    makeLog('2026-06-01T14:00:00Z', 1, 'WORKOUT'),
    makeLog('2026-06-02T14:00:00Z', 1, 'WORKOUT'),
    makeLog('2026-06-03T14:00:00Z', 1, 'WORKOUT'),
    // W22: only 2 workouts — fails target of 3
    makeLog('2026-05-25T14:00:00Z', 1, 'WORKOUT'),
    makeLog('2026-05-26T14:00:00Z', 1, 'WORKOUT'),
  ]);

  const result = await calculateWorkoutWeeklyStreak('user-1', 3);
  expect(result).toBe(1);
});
