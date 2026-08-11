import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

vi.mock('../userService', () => ({
  userService: { checkUserPermissions: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../challengeService', () => ({
  getActiveForUser: vi.fn(),
}));

vi.mock('../dailySummaryService', () => ({
  generateForUser: vi.fn().mockResolvedValue(undefined),
}));

import { logService } from '../logService';
import { getActiveForUser } from '../challengeService';

const mockGetActiveForUser = vi.mocked(getActiveForUser);

const BASE_LOG = {
  id: 'log-1',
  userId: 'user-1',
  category: 'workout',
  primaryValue: 80,
  details: {},
  eventTime: new Date('2026-08-11T15:00:00.000Z'),
  source: 'UNKNOWN',
  createdAt: new Date(),
};

const BASE_CHALLENGE = {
  id: 'challenge-1',
  teamId: 'team-1',
  goalDescription: 'Desafio fit',
  coverImageUrl: null,
  startDate: new Date('2026-08-01T00:00:00.000Z'),
  endDate: new Date('2026-08-31T23:59:59.000Z'),
  shareWorkouts: true,
  shareMeals: true,
  shareWater: true,
  weeklyEvolution: false,
  dailySummary: false,
  createdAt: new Date(),
  team: { id: 'team-1', name: 'Desafio fit', description: null, inviteCode: 'abc', createdAt: new Date(), updatedAt: new Date() },
};

function setupTransactionMock() {
  prismaMock.$transaction.mockImplementation(
    async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setupTransactionMock();
  // By default: no prior log today (first log of the day)
  prismaMock.dailyLog.findFirst.mockResolvedValue(null);
  prismaMock.dailyLog.create.mockResolvedValue(BASE_LOG as never);
  prismaMock.post.create.mockResolvedValue({} as never);
});

const LOG_DATA_CASES = [
  { category: 'workout', flag: 'shareWorkouts' as const },
  { category: 'food',    flag: 'shareMeals'   as const },
  { category: 'water',   flag: 'shareWater'   as const },
] as const;

describe('logService.saveLog — challenge post creation', () => {
  it.each(LOG_DATA_CASES)(
    'categoria $category com $flag=true → cria Post no team do desafio',
    async ({ category, flag }) => {
      // Arrange
      const challenge = { ...BASE_CHALLENGE, shareWorkouts: false, shareMeals: false, shareWater: false, [flag]: true };
      mockGetActiveForUser.mockResolvedValue([challenge as never]);

      // Act
      await logService.saveLog('user-1', {
        category,
        primary_value: 80,
        details: {},
        event_time: '2026-08-11T15:00:00.000Z',
      });

      // Assert
      expect(prismaMock.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teamId: 'team-1',
            authorId: 'user-1',
            type: 'SYSTEM_MILESTONE',
          }),
        }),
      );
    },
  );

  it.each(LOG_DATA_CASES)(
    'categoria $category com $flag=false → não cria Post',
    async ({ category, flag }) => {
      // Arrange
      const challenge = { ...BASE_CHALLENGE, shareWorkouts: false, shareMeals: false, shareWater: false, [flag]: false };
      mockGetActiveForUser.mockResolvedValue([challenge as never]);

      // Act
      await logService.saveLog('user-1', {
        category,
        primary_value: 80,
        details: {},
        event_time: '2026-08-11T15:00:00.000Z',
      });

      // Assert
      expect(prismaMock.post.create).not.toHaveBeenCalled();
    },
  );

  it('sem desafios ativos → não cria Post', async () => {
    // Arrange
    mockGetActiveForUser.mockResolvedValue([]);

    // Act
    await logService.saveLog('user-1', {
      category: 'workout',
      primary_value: 80,
      details: {},
      event_time: '2026-08-11T15:00:00.000Z',
    });

    // Assert
    expect(prismaMock.post.create).not.toHaveBeenCalled();
  });

  it('categoria não mapeada (ex: poop) → não cria Post mesmo com desafio ativo', async () => {
    // Arrange
    mockGetActiveForUser.mockResolvedValue([BASE_CHALLENGE as never]);

    // Act
    await logService.saveLog('user-1', {
      category: 'poop',
      primary_value: 1,
      details: {},
      event_time: '2026-08-11T15:00:00.000Z',
    });

    // Assert
    expect(prismaMock.post.create).not.toHaveBeenCalled();
  });
});
