import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

// joinTeamByCode is called by joinChallenge — mock the whole teamService
vi.mock('../teamService', () => ({
  joinTeamByCode: vi.fn(),
}));

import * as challengeService from '../challengeService';
import { joinTeamByCode } from '../teamService';

const mockJoinTeamByCode = vi.mocked(joinTeamByCode);

const BASE_CHALLENGE = {
  id: 'challenge-1',
  teamId: 'team-1',
  goalDescription: 'Desafio de hidratação',
  coverImageUrl: null,
  startDate: new Date('2026-08-01T00:00:00.000Z'),
  endDate: new Date('2026-08-31T23:59:59.000Z'),
  shareWorkouts: true,
  shareMeals: false,
  shareWater: true,
  weeklyEvolution: false,
  dailySummary: false,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
};

const BASE_TEAM = {
  id: 'team-1',
  name: 'Desafio de hidratação',
  description: null,
  inviteCode: 'abc-123',
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('challengeService.createChallenge', () => {
  it('cria Team e Challenge atomicamente via $transaction', async () => {
    // Arrange
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock),
    );
    prismaMock.team.create.mockResolvedValue(BASE_TEAM as never);
    prismaMock.challenge.create.mockResolvedValue(BASE_CHALLENGE as never);

    const input = {
      goalDescription: 'Desafio de hidratação',
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-08-31T23:59:59.000Z',
      shareWorkouts: true,
      shareMeals: false,
      shareWater: true,
      weeklyEvolution: false,
      dailySummary: false,
    };

    // Act
    const result = await challengeService.createChallenge('nutri-1', input);

    // Assert
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.team.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Desafio de hidratação',
          members: { create: { userId: 'nutri-1', role: 'ADMIN' } },
        }),
      }),
    );
    expect(prismaMock.challenge.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teamId: 'team-1',
          goalDescription: 'Desafio de hidratação',
          shareWorkouts: true,
          shareWater: true,
        }),
      }),
    );
    expect(result.team.id).toBe('team-1');
    expect(result.challenge.id).toBe('challenge-1');
  });
});

describe('challengeService.joinChallenge', () => {
  it('lança erro e não adiciona membro quando endDate está no passado', async () => {
    // Arrange
    const expiredChallenge = {
      ...BASE_CHALLENGE,
      endDate: new Date('2020-01-01T00:00:00.000Z'), // passado
    };
    prismaMock.team.findUnique.mockResolvedValue({
      ...BASE_TEAM,
      challenge: expiredChallenge,
    } as never);

    // Act & Assert
    await expect(
      challengeService.joinChallenge('user-1', 'abc-123'),
    ).rejects.toThrow('Desafio encerrado.');

    expect(mockJoinTeamByCode).not.toHaveBeenCalled();
  });

  it('lança erro com código inválido', async () => {
    // Arrange
    prismaMock.team.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(
      challengeService.joinChallenge('user-1', 'codigo-invalido'),
    ).rejects.toThrow('Código de convite inválido.');

    expect(mockJoinTeamByCode).not.toHaveBeenCalled();
  });

  it('permite ingresso quando dentro da janela do desafio', async () => {
    // Arrange — endDate no futuro
    prismaMock.team.findUnique.mockResolvedValue({
      ...BASE_TEAM,
      challenge: BASE_CHALLENGE, // endDate: 2026-08-31 (futuro em relação a hoje, 2026-08-11)
    } as never);
    mockJoinTeamByCode.mockResolvedValue({
      id: 'team-1',
      name: 'Desafio de hidratação',
      description: null,
      inviteCode: 'abc-123',
      memberCount: 2,
      createdAt: BASE_TEAM.createdAt.toISOString(),
    });

    // Act
    const result = await challengeService.joinChallenge('user-2', 'abc-123');

    // Assert
    expect(mockJoinTeamByCode).toHaveBeenCalledWith('user-2', 'abc-123');
    expect(result.memberCount).toBe(2);
  });
});
