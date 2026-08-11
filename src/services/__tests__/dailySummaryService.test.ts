import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

vi.mock('../challengeService', () => ({
  getActiveForUserOnDate: vi.fn(),
}));

import { generateForUser, triggerDailySummaries } from '../dailySummaryService';
import { getActiveForUserOnDate } from '../challengeService';

const mockGetActiveForUserOnDate = vi.mocked(getActiveForUserOnDate);

const YESTERDAY = new Date('2026-08-10T00:00:00.000Z');

const BASE_CHALLENGE = {
  id: 'challenge-1',
  teamId: 'team-1',
  goalDescription: 'Desafio fit',
  coverImageUrl: null,
  startDate: new Date('2026-08-01T00:00:00.000Z'),
  endDate: new Date('2026-08-31T23:59:59.000Z'),
  shareWorkouts: false,
  shareMeals: false,
  shareWater: false,
  weeklyEvolution: false,
  dailySummary: true,
  createdAt: new Date(),
  team: { id: 'team-1', name: 'Desafio fit', description: null, inviteCode: 'abc', createdAt: new Date(), updatedAt: new Date() },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dailySummaryService.generateForUser', () => {
  it('não cria nada se nenhum challenge ativo tem dailySummary=true', async () => {
    // Arrange
    mockGetActiveForUserOnDate.mockResolvedValue([
      { ...BASE_CHALLENGE, dailySummary: false } as never,
    ]);

    // Act
    await generateForUser('user-1', YESTERDAY);

    // Assert
    expect(prismaMock.dailyLog.findMany).not.toHaveBeenCalled();
    expect(prismaMock.teamFeedPost.create).not.toHaveBeenCalled();
  });

  it('cenário principal: cria TeamFeedPost com tipo CHALLENGE_SUMMARY', async () => {
    // Arrange
    mockGetActiveForUserOnDate.mockResolvedValue([BASE_CHALLENGE as never]);
    prismaMock.dailyLog.findMany.mockResolvedValue([
      { category: 'water', primaryValue: 2000 },
      { category: 'workout', primaryValue: 85 },
    ] as never);
    prismaMock.teamFeedPost.create.mockResolvedValue({} as never);

    // Act
    await generateForUser('user-1', YESTERDAY);

    // Assert
    expect(prismaMock.teamFeedPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teamId: 'team-1',
          patientId: 'user-1',
          type: 'CHALLENGE_SUMMARY',
          challengeId: 'challenge-1',
          metadata: expect.objectContaining({
            pillars: expect.objectContaining({ water: 2000, workout: 85 }),
          }),
        }),
      }),
    );
  });

  it('segundo trigger no mesmo dia: captura P2002 e não lança erro', async () => {
    // Arrange
    mockGetActiveForUserOnDate.mockResolvedValue([BASE_CHALLENGE as never]);
    prismaMock.dailyLog.findMany.mockResolvedValue([]);

    const uniqueViolation = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '7.0.0', meta: {} },
    );
    prismaMock.teamFeedPost.create.mockRejectedValue(uniqueViolation);

    // Act & Assert — não deve lançar
    await expect(generateForUser('user-1', YESTERDAY)).resolves.toBeUndefined();
    expect(prismaMock.teamFeedPost.create).toHaveBeenCalledTimes(1);
  });

  it('usuário sem logs no dia recebe resumo com conteúdo "Sem registros"', async () => {
    // Arrange
    mockGetActiveForUserOnDate.mockResolvedValue([BASE_CHALLENGE as never]);
    prismaMock.dailyLog.findMany.mockResolvedValue([]);
    prismaMock.teamFeedPost.create.mockResolvedValue({} as never);

    // Act
    await generateForUser('user-zero-logs', YESTERDAY);

    // Assert
    expect(prismaMock.teamFeedPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: 'Sem registros neste dia.',
        }),
      }),
    );
  });
});

describe('dailySummaryService.triggerDailySummaries (cron)', () => {
  it('gera resumo para cada membro de cada challenge ativo com dailySummary=true', async () => {
    // Arrange
    prismaMock.challenge.findMany.mockResolvedValue([
      {
        ...BASE_CHALLENGE,
        team: {
          ...BASE_CHALLENGE.team,
          members: [{ userId: 'user-a' }, { userId: 'user-b' }],
        },
      },
    ] as never);

    mockGetActiveForUserOnDate.mockResolvedValue([BASE_CHALLENGE as never]);
    prismaMock.dailyLog.findMany.mockResolvedValue([]);
    prismaMock.teamFeedPost.create.mockResolvedValue({} as never);

    // Act
    const result = await triggerDailySummaries();

    // Assert
    expect(result.processed).toBe(2);
    expect(result.errors).toBe(0);
    expect(prismaMock.teamFeedPost.create).toHaveBeenCalledTimes(2);
  });

  it('continua para os demais membros mesmo que um falhe', async () => {
    // Arrange
    prismaMock.challenge.findMany.mockResolvedValue([
      {
        ...BASE_CHALLENGE,
        team: {
          ...BASE_CHALLENGE.team,
          members: [{ userId: 'user-ok' }, { userId: 'user-fail' }],
        },
      },
    ] as never);

    prismaMock.dailyLog.findMany.mockResolvedValue([]);

    // user-ok → sucesso, user-fail → erro genérico
    mockGetActiveForUserOnDate
      .mockResolvedValueOnce([BASE_CHALLENGE as never]) // user-ok
      .mockRejectedValueOnce(new Error('DB timeout'));  // user-fail

    prismaMock.teamFeedPost.create.mockResolvedValue({} as never);

    // Act
    const result = await triggerDailySummaries();

    // Assert
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(1);
  });
});
