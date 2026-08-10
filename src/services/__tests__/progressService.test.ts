/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getWeeklyProgress, getWeeklyHistory } from '../progressService';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

vi.mock('../historyService', () => ({
  historyService: {
    calculateDayScore: vi.fn(),
  },
}));

import { historyService } from '../historyService';

const mockCalculateDayScore = vi.mocked(historyService.calculateDayScore);

// 2026-08-10 is a Monday. BRT = UTC-3, so noon BRT = 15:00 UTC.
const MONDAY_BRT = new Date('2026-08-10T15:00:00.000Z'); // noon Mon BRT
const WEDNESDAY_BRT = new Date('2026-08-12T15:00:00.000Z'); // noon Wed BRT
const SUNDAY_BRT = new Date('2026-08-16T15:00:00.000Z'); // noon Sun BRT

const USER_ID = 'user-1';

function makeLog(category: string, eventTime: Date) {
  return {
    id: 'log-x',
    userId: USER_ID,
    category,
    primaryValue: 80,
    eventTime,
    createdAt: eventTime,
    details: {},
    source: 'UNKNOWN',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getWeeklyProgress', () => {
  it('detects Monday correctly in BRT timezone when running from Wednesday', async () => {
    vi.setSystemTime(WEDNESDAY_BRT);

    prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
    prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null, profile: null } as any);

    const days = await getWeeklyProgress(USER_ID);

    expect(days).toHaveLength(7);
    // First day must be Monday August 10
    const firstDay = days[0];
    expect(firstDay.dayLabel).toBe('S'); // Segunda
    expect(firstDay.isFuture).toBe(false);

    // Wednesday (index 2) is today
    expect(days[2].isToday).toBe(true);
  });

  it('marks future days with score: null and isFuture: true', async () => {
    vi.setSystemTime(WEDNESDAY_BRT);

    prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
    prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null, profile: null } as any);

    const days = await getWeeklyProgress(USER_ID);

    // Thu (3), Fri (4), Sat (5), Sun (6) are future
    for (let i = 3; i <= 6; i++) {
      expect(days[i].isFuture).toBe(true);
      expect(days[i].score).toBeNull();
    }
  });

  it('returns score: 0 for today when no logs exist', async () => {
    vi.setSystemTime(MONDAY_BRT);

    prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
    prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null, profile: null } as any);

    const days = await getWeeklyProgress(USER_ID);

    const today = days.find((d) => d.isToday);
    expect(today).toBeDefined();
    expect(today!.score).toBe(0);
  });

  it('returns score: null for past days with no logs (not 0)', async () => {
    vi.setSystemTime(WEDNESDAY_BRT); // Wednesday; Mon and Tue are past

    prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
    prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null, profile: null } as any);

    const days = await getWeeklyProgress(USER_ID);

    // Monday (0) and Tuesday (1) are past, no logs → score: null
    expect(days[0].isFuture).toBe(false);
    expect(days[0].isToday).toBe(false);
    expect(days[0].score).toBeNull();

    expect(days[1].isFuture).toBe(false);
    expect(days[1].isToday).toBe(false);
    expect(days[1].score).toBeNull();
  });

  it('calls calculateDayScore for days that have logs and uses the result', async () => {
    vi.setSystemTime(MONDAY_BRT);

    const mondayLog = makeLog('water', new Date('2026-08-10T15:00:00.000Z'));
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([mondayLog as any]);
    prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null, profile: null } as any);
    mockCalculateDayScore.mockReturnValueOnce(72);

    const days = await getWeeklyProgress(USER_ID);

    const today = days.find((d) => d.isToday);
    expect(today!.score).toBe(72);
    expect(mockCalculateDayScore).toHaveBeenCalled();
  });
});

describe('getWeeklyHistory — degree classification', () => {
  // Helper: set up prisma mocks to produce a week with a known average score
  async function getHistoryWithScore(score: number) {
    vi.setSystemTime(SUNDAY_BRT); // All 7 days of current week are not future

    const mondayStart = new Date('2026-08-10T03:00:00.000Z'); // Mon 00:00 BRT

    // One log per day for the whole week
    const weekLogs = Array.from({ length: 7 }, (_, i) => {
      const eventTime = new Date(mondayStart.getTime() + i * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000);
      return makeLog('water', eventTime);
    });

    const firstLog = weekLogs[0];
    prismaMock.dailyLog.findFirst.mockResolvedValueOnce(firstLog as any);
    prismaMock.dailyLog.findMany.mockResolvedValueOnce(weekLogs as any);
    prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null, profile: null } as any);
    mockCalculateDayScore.mockReturnValue(score);

    const history = await getWeeklyHistory(USER_ID);
    mockCalculateDayScore.mockReset();
    return history;
  }

  it('classifies average > 90 as Excelente', async () => {
    const history = await getHistoryWithScore(91);
    expect(history[0].degree).toBe('Excelente');
  });

  it('classifies average > 80 (and <= 90) as Muito Boa', async () => {
    const history = await getHistoryWithScore(85);
    expect(history[0].degree).toBe('Muito Boa');
  });

  it('classifies average > 70 (and <= 80) as Boa', async () => {
    const history = await getHistoryWithScore(75);
    expect(history[0].degree).toBe('Boa');
  });

  it('classifies average > 60 (and <= 70) as Regular', async () => {
    const history = await getHistoryWithScore(65);
    expect(history[0].degree).toBe('Regular');
  });

  it('classifies average <= 60 as Ruim', async () => {
    const history = await getHistoryWithScore(50);
    expect(history[0].degree).toBe('Ruim');
  });

  it('returns weeks in reverse order (newest first)', async () => {
    vi.setSystemTime(SUNDAY_BRT);

    // First log 2 weeks ago — expect 2 weeks returned, current week first
    const twoWeeksAgoLog = makeLog('water', new Date('2026-07-27T15:00:00.000Z'));
    prismaMock.dailyLog.findFirst.mockResolvedValueOnce(twoWeeksAgoLog as any);
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([twoWeeksAgoLog as any]);
    prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null, profile: null } as any);
    mockCalculateDayScore.mockReturnValue(70);

    const history = await getWeeklyHistory(USER_ID);

    expect(history.length).toBeGreaterThanOrEqual(2);
    // Newest week first → startDate of first item >= startDate of second item
    expect(history[0].startDate.getTime()).toBeGreaterThan(history[1].startDate.getTime());
    expect(history[0].isCurrentWeek).toBe(true);
  });
});
