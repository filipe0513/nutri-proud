/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jacadaService } from '../jacadaService';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

vi.mock('../aiService', () => ({
  aiService: {
    generateRawText: vi.fn(),
  },
}));

vi.mock('../notificationService', () => ({
  createJacadaNotification: vi.fn().mockResolvedValue(undefined),
}));

import { aiService } from '../aiService';

const mockGenerateRawText = vi.mocked(aiService.generateRawText);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-10T15:00:00.000Z')); // noon BRT (UTC-3)
});

afterEach(() => {
  vi.useRealTimers();
});

const USER_ID = 'user-1';

function makeJacadaLog(daysAgo: number, details = { sugar: 3, fat: 2, alcohol: 0 }) {
  const eventTime = new Date('2026-08-10T15:00:00.000Z');
  eventTime.setDate(eventTime.getDate() - daysAgo);
  return { eventTime, details };
}

describe('jacadaService.buildHistorySummary', () => {
  it('returns no-logs message and no escalation when user has 0 prior jacadas', async () => {
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);

    const { historySummary, escalationNote } = await jacadaService.buildHistorySummary(USER_ID);

    expect(historySummary).toContain('Nenhuma jacada registrada nos últimos 7 dias');
    expect(escalationNote).toBe('');
  });

  it('returns formatted summary and no escalation for 1-2 non-consecutive logs', async () => {
    const logs = [
      makeJacadaLog(5), // 5 days ago — not consecutive with today
    ];
    prismaMock.dailyLog.findMany.mockResolvedValueOnce(logs as any);

    const { historySummary, escalationNote } = await jacadaService.buildHistorySummary(USER_ID);

    expect(historySummary).toContain('Açúcar 3/5');
    expect(escalationNote).toBe('');
  });

  it('adds escalation note when 3+ consecutive days have jacadas', async () => {
    // today, yesterday, day before → 3 consecutive days
    const logs = [
      makeJacadaLog(0), // today
      makeJacadaLog(1), // yesterday
      makeJacadaLog(2), // 2 days ago
    ];
    prismaMock.dailyLog.findMany.mockResolvedValueOnce(logs as any);

    const { escalationNote } = await jacadaService.buildHistorySummary(USER_ID);

    expect(escalationNote).toContain('3º dia consecutivo');
    expect(escalationNote).toContain('ATENÇÃO');
  });

  it('adds a mild note at exactly 2 consecutive days', async () => {
    const logs = [
      makeJacadaLog(0), // today
      makeJacadaLog(1), // yesterday
    ];
    prismaMock.dailyLog.findMany.mockResolvedValueOnce(logs as any);

    const { escalationNote } = await jacadaService.buildHistorySummary(USER_ID);

    expect(escalationNote).toContain('2º dia seguido');
  });
});

describe('jacadaService.generateJacadaReaction', () => {
  it('returns reaction text on happy path', async () => {
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
    mockGenerateRawText.mockResolvedValueOnce('Essa fritada não era necessária! 🚨');

    const result = await jacadaService.generateJacadaReaction(
      USER_ID,
      undefined,
      { sugar: 3, fat: 4, alcohol: 0 }
    );

    expect(result).toBe('Essa fritada não era necessária! 🚨');
    expect(mockGenerateRawText).toHaveBeenCalledWith(expect.stringContaining('Frituras/Fast Food: 4/5'));
  });

  it('updates the log details when logId is provided', async () => {
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
    mockGenerateRawText.mockResolvedValueOnce('Cuide-se! 😤');
    prismaMock.dailyLog.findUnique.mockResolvedValueOnce({
      id: 'log-1',
      details: { sugar: 3 },
    } as any);
    prismaMock.dailyLog.update.mockResolvedValueOnce({} as any);

    await jacadaService.generateJacadaReaction(USER_ID, 'log-1', { sugar: 3, fat: 0, alcohol: 0 });

    // Allow fire-and-forget to settle (fake timers are active, so advance them)
    await vi.runAllTimersAsync();

    expect(prismaMock.dailyLog.findUnique).toHaveBeenCalledWith({
      where: { id: 'log-1', userId: USER_ID },
    });
    expect(prismaMock.dailyLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({ nutri_reaction: 'Cuide-se! 😤' }),
        }),
      })
    );
  });

  it('throws when the AI service throws', async () => {
    prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
    mockGenerateRawText.mockRejectedValueOnce(new Error('Gemini API down'));

    await expect(
      jacadaService.generateJacadaReaction(USER_ID, undefined, { sugar: 1, fat: 1, alcohol: 1 })
    ).rejects.toThrow('Gemini API down');
  });
});
