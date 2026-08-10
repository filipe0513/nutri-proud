/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { insightService } from '../insightService';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

vi.mock('../aiService', () => ({
  aiService: {
    generateRawText: vi.fn(),
    generateInsightFromLogs: vi.fn(),
  },
}));

vi.mock('../notificationService', () => ({
  createInsightNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../patientContextService', () => ({
  getPatientContext: vi.fn(),
}));

import { aiService } from '../aiService';
import { getPatientContext } from '../patientContextService';

const mockGenerateRawText = vi.mocked(aiService.generateRawText);
const mockGetPatientContext = vi.mocked(getPatientContext);

const USER_ID = 'user-1';

// A minimal PatientContext that satisfies the service's destructuring
function makeContext(overrides: Partial<{
  todayLogs: any[];
  currentStreak: number;
  yesterdayScore: number | null;
}> = {}) {
  return {
    last30Logs: [],
    todayLogs: overrides.todayLogs ?? [],
    weeklyProgress: [
      { isFuture: false, isToday: true, score: null },
      { isFuture: true, isToday: false, score: null },
      { isFuture: true, isToday: false, score: null },
      { isFuture: true, isToday: false, score: null },
      { isFuture: true, isToday: false, score: null },
      { isFuture: true, isToday: false, score: null },
      { isFuture: true, isToday: false, score: null },
    ],
    waterGoalMl: 2500,
    sleepGoalHours: 8,
    workoutGoalPerWeek: 3,
    mealsGoalPerDay: 3,
    mainGoal: 'health',
    waterMlToday: 500,
    waterPctToday: 20,
    mealsToday: 1,
    lastSleepScore: 80,
    workoutsThisWeek: 2,
    daysSinceLastWorkout: 1,
    weeklyFrequency: {},
    currentStreak: overrides.currentStreak ?? 0,
    yesterdayScore: overrides.yesterdayScore ?? null,
    targets: {},
    profile: {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('insightService.generateContextualInsight', () => {
  describe('Rate limit', () => {
    it('returns existing insight without calling AI when one was generated < 1h ago', async () => {
      const recentInsight = {
        id: 'ins-1',
        userId: USER_ID,
        message: 'Beba mais água!',
        cta: 'WATER',
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      };
      prismaMock.aiInsight.findFirst.mockResolvedValueOnce(recentInsight as any);

      const result = await insightService.generateContextualInsight(USER_ID, '2026-08-10T12:00:00-03:00');

      expect(result).toEqual(recentInsight);
      expect(mockGenerateRawText).not.toHaveBeenCalled();
    });
  });

  describe('JSON parse failure', () => {
    it('falls back gracefully when AI returns non-JSON text', async () => {
      prismaMock.aiInsight.findFirst.mockResolvedValueOnce(null);
      mockGetPatientContext.mockResolvedValueOnce(makeContext() as any);
      mockGenerateRawText.mockResolvedValueOnce('Isso é texto livre sem JSON!');
      prismaMock.aiInsight.create.mockResolvedValueOnce({ id: 'ins-2' } as any);

      await expect(
        insightService.generateContextualInsight(USER_ID, '2026-08-10T12:00:00-03:00')
      ).resolves.not.toThrow();

      expect(prismaMock.aiInsight.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            // message is the fallback truncated text
            message: expect.stringContaining('Isso é texto livre sem JSON!'),
            cta: null,
          }),
        })
      );
    });
  });

  describe('CTA validation', () => {
    it('persists a valid CTA unchanged', async () => {
      prismaMock.aiInsight.findFirst.mockResolvedValueOnce(null);
      mockGetPatientContext.mockResolvedValueOnce(makeContext() as any);
      mockGenerateRawText.mockResolvedValueOnce(JSON.stringify({ message: 'Beba água!', cta: 'WATER' }));
      prismaMock.aiInsight.create.mockResolvedValueOnce({ id: 'ins-3' } as any);

      await insightService.generateContextualInsight(USER_ID, '2026-08-10T12:00:00-03:00');

      expect(prismaMock.aiInsight.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cta: 'WATER' }),
        })
      );
    });

    it('sanitizes invalid CTA to null', async () => {
      prismaMock.aiInsight.findFirst.mockResolvedValueOnce(null);
      mockGetPatientContext.mockResolvedValueOnce(makeContext() as any);
      mockGenerateRawText.mockResolvedValueOnce(
        JSON.stringify({ message: 'Cuide-se!', cta: 'INVALID_CTA' })
      );
      prismaMock.aiInsight.create.mockResolvedValueOnce({ id: 'ins-4' } as any);

      await insightService.generateContextualInsight(USER_ID, '2026-08-10T12:00:00-03:00');

      expect(prismaMock.aiInsight.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cta: null }),
        })
      );
    });

    it.each(['WORKOUT', 'SLEEP', 'WATER', 'FOOD', 'POOP'])(
      'accepts %s as a valid CTA',
      async (validCta) => {
        prismaMock.aiInsight.findFirst.mockResolvedValueOnce(null);
        mockGetPatientContext.mockResolvedValueOnce(makeContext() as any);
        mockGenerateRawText.mockResolvedValueOnce(
          JSON.stringify({ message: 'Test message', cta: validCta })
        );
        prismaMock.aiInsight.create.mockResolvedValueOnce({ id: 'ins-cta' } as any);

        await insightService.generateContextualInsight(USER_ID, '2026-08-10T12:00:00-03:00');

        expect(prismaMock.aiInsight.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ cta: validCta }),
          })
        );

        vi.clearAllMocks();
      }
    );
  });

  describe('Weekend rule', () => {
    it('includes weekend reduction-of-harm rule on Friday >= 12h', async () => {
      prismaMock.aiInsight.findFirst.mockResolvedValueOnce(null);
      mockGetPatientContext.mockResolvedValueOnce(makeContext() as any);
      mockGenerateRawText.mockResolvedValueOnce(JSON.stringify({ message: 'Teste', cta: null }));
      prismaMock.aiInsight.create.mockResolvedValueOnce({ id: 'ins-5' } as any);

      // Friday August 14 2026 at 14:00 BRT
      await insightService.generateContextualInsight(USER_ID, '2026-08-14T14:00:00-03:00');

      expect(mockGenerateRawText).toHaveBeenCalledWith(
        expect.stringContaining('Redução de Danos')
      );
    });

    it('does NOT include weekend rule on a regular weekday', async () => {
      prismaMock.aiInsight.findFirst.mockResolvedValueOnce(null);
      mockGetPatientContext.mockResolvedValueOnce(makeContext() as any);
      mockGenerateRawText.mockResolvedValueOnce(JSON.stringify({ message: 'Teste', cta: null }));
      prismaMock.aiInsight.create.mockResolvedValueOnce({ id: 'ins-6' } as any);

      // Monday August 10 2026 at 10:00 BRT
      await insightService.generateContextualInsight(USER_ID, '2026-08-10T10:00:00-03:00');

      expect(mockGenerateRawText).toHaveBeenCalledWith(
        expect.not.stringContaining('Redução de Danos')
      );
    });
  });

  describe('Streak detection', () => {
    it('includes streak count in the prompt when currentStreak >= 2', async () => {
      prismaMock.aiInsight.findFirst.mockResolvedValueOnce(null);
      mockGetPatientContext.mockResolvedValueOnce(makeContext({ currentStreak: 5 }) as any);
      mockGenerateRawText.mockResolvedValueOnce(JSON.stringify({ message: 'Incrível!', cta: null }));
      prismaMock.aiInsight.create.mockResolvedValueOnce({ id: 'ins-7' } as any);

      await insightService.generateContextualInsight(USER_ID, '2026-08-10T12:00:00-03:00');

      expect(mockGenerateRawText).toHaveBeenCalledWith(
        expect.stringContaining('5 dia(s)')
      );
    });
  });

  describe('Missing categories', () => {
    it('reports all 5 pillars as missing when no logs exist today', async () => {
      prismaMock.aiInsight.findFirst.mockResolvedValueOnce(null);
      mockGetPatientContext.mockResolvedValueOnce(makeContext({ todayLogs: [] }) as any);
      mockGenerateRawText.mockResolvedValueOnce(JSON.stringify({ message: 'Comece agora!', cta: null }));
      prismaMock.aiInsight.create.mockResolvedValueOnce({ id: 'ins-8' } as any);

      await insightService.generateContextualInsight(USER_ID, '2026-08-10T12:00:00-03:00');

      const promptArg = mockGenerateRawText.mock.calls[0][0];
      expect(promptArg).toContain('WATER');
      expect(promptArg).toContain('FOOD');
      expect(promptArg).toContain('SLEEP');
      expect(promptArg).toContain('WORKOUT');
      expect(promptArg).toContain('POOP');
    });

    it('reports no missing categories when all 5 pillars are logged', async () => {
      const todayLogs = [
        { category: 'water', primaryValue: 80, details: {}, eventTime: new Date() },
        { category: 'food', primaryValue: 70, details: {}, eventTime: new Date() },
        { category: 'sleep', primaryValue: 85, details: {}, eventTime: new Date() },
        { category: 'workout', primaryValue: 90, details: {}, eventTime: new Date() },
        { category: 'poop', primaryValue: 75, details: {}, eventTime: new Date() },
      ];

      prismaMock.aiInsight.findFirst.mockResolvedValueOnce(null);
      mockGetPatientContext.mockResolvedValueOnce(makeContext({ todayLogs }) as any);
      mockGenerateRawText.mockResolvedValueOnce(JSON.stringify({ message: 'Perfeito!', cta: null }));
      prismaMock.aiInsight.create.mockResolvedValueOnce({ id: 'ins-9' } as any);

      await insightService.generateContextualInsight(USER_ID, '2026-08-10T12:00:00-03:00');

      expect(mockGenerateRawText).toHaveBeenCalledWith(
        expect.stringContaining('nenhum — parabéns!')
      );
    });
  });
});
