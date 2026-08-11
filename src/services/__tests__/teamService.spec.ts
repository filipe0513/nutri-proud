import { expect, test, vi, describe, beforeEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';
import * as teamService from '../teamService';

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

describe('teamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardTeams', () => {
    test('retorna os times do usuário normal sem auto-seed', async () => {
      // Arrange
      prismaMock.teamMember.findMany.mockResolvedValue([
        {
          team: {
            id: 'team-1',
            name: 'Meu Time',
            description: null,
            inviteCode: 'code-1',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            _count: { members: 2 }
          }
        }
      ] as never);

      // Act
      const result = await teamService.getDashboardTeams('user-1', 'USER');

      // Assert
      expect(prismaMock.teamMember.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.any(Object),
        orderBy: { joinedAt: 'desc' }
      });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Meu Time');
    });

    test('realiza auto-seed para ADMIN que não possui times', async () => {
      // Arrange
      prismaMock.teamMember.findMany
        .mockResolvedValueOnce([]) // Primeira chamada: 0 times
        .mockResolvedValueOnce([   // Segunda chamada: Time criado
          {
            team: {
              id: 'team-admin',
              name: 'Meu Consultório (Admin)',
              description: 'Time de dogfooding automático. Você é o dono e também o primeiro paciente.',
              inviteCode: 'code-admin',
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              _count: { members: 1 }
            }
          }
        ] as never);

      // Mocka o $transaction do Prisma para chamar a callback injetando o próprio prismaMock
      prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => {
        return callback(prismaMock);
      });
      
      prismaMock.team.create.mockResolvedValue({} as never);

      // Act
      const result = await teamService.getDashboardTeams('admin-1', 'ADMIN');

      // Assert
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.team.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Meu Consultório (Admin)',
          members: {
            create: { userId: 'admin-1', role: 'ADMIN' },
          },
        })
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Meu Consultório (Admin)');
    });
  });

  describe('createTeam', () => {
    test('cria um novo team e adiciona o criador como ADMIN', async () => {
      // Arrange
      prismaMock.team.create.mockResolvedValue({
        id: 'team-2',
        name: 'Time de Teste',
        description: 'Desc',
        inviteCode: 'invite-2',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        _count: { members: 1 }
      } as never);

      // Act
      const result = await teamService.createTeam('user-1', { name: 'Time de Teste', description: 'Desc' });

      // Assert
      expect(prismaMock.team.create).toHaveBeenCalledWith({
        data: {
          name: 'Time de Teste',
          description: 'Desc',
          members: {
            create: { userId: 'user-1', role: 'ADMIN' }
          }
        },
        include: expect.any(Object)
      });
      expect(result.id).toBe('team-2');
      expect(result.memberCount).toBe(1);
    });
  });

  describe('joinTeamByCode', () => {
    test('lança erro se o código for inválido', async () => {
      // Arrange
      prismaMock.team.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        teamService.joinTeamByCode('user-1', 'invalid-code')
      ).rejects.toThrow('Código de convite inválido.');
    });

    test('lança erro se o usuário já for membro', async () => {
      // Arrange
      prismaMock.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 1 } } as never);
      prismaMock.teamMember.findUnique.mockResolvedValue({ id: 'member-1' } as never);

      // Act & Assert
      await expect(
        teamService.joinTeamByCode('user-1', 'valid-code')
      ).rejects.toThrow('Você já é membro deste Team.');
    });

    test('adiciona o usuário como MEMBER no team', async () => {
      // Arrange
      prismaMock.team.findFirst.mockResolvedValue({
        id: 'team-1',
        name: 'Time Valid',
        description: null,
        inviteCode: 'valid-code',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        _count: { members: 1 }
      } as never);
      prismaMock.teamMember.findUnique.mockResolvedValue(null);
      prismaMock.teamMember.create.mockResolvedValue({} as never);

      // Act
      const result = await teamService.joinTeamByCode('user-2', 'valid-code');

      // Assert
      expect(prismaMock.teamMember.create).toHaveBeenCalledWith({
        data: { teamId: 'team-1', userId: 'user-2', role: 'MEMBER' }
      });
      expect(result.memberCount).toBe(2);
    });
  });
});
