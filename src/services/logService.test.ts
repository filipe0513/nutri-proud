/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logService } from './logService';
import { prisma } from '@/lib/prisma';
import { userService } from './userService';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyLog: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('./userService', () => ({
  userService: {
    checkUserPermissions: vi.fn(),
  },
}));

describe('logService.registerJacada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deduct penalty in cascade from food logs', async () => {
    // Arrange
    const userId = 'user-123';
    const mockLogs = [
      { id: 'log1', primaryValue: 60 },
      { id: 'log2', primaryValue: 40 },
    ];

    (prisma.dailyLog.findMany as any).mockResolvedValue(mockLogs);
    
    // Simula a transação simplesmente retornando os resultados
    (prisma.$transaction as any).mockImplementation((updates: any) => Promise.resolve(updates));

    // Act
    // Penalty será (1 + 3 + 4) * 10 = 80
    const result = await logService.registerJacada(userId, { sugar: 1, fat: 3, alcohol: 4 });

    // Assert
    expect(userService.checkUserPermissions).toHaveBeenCalledWith(userId);
    expect(result.penalty).toBe(80);
    expect(result.updatedCount).toBe(2);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    
    // Verifica se os updates gerados estão corretos.
    // O primeiro log (60 pts) deve ter 60 pts deduzidos (ficando 0).
    // O segundo log (40 pts) deve ter os 20 pts restantes deduzidos (ficando 20).
    const transactionArg = (prisma.$transaction as any).mock.calls[0][0];
    
    expect(transactionArg).toHaveLength(2);
    
    // prisma.dailyLog.update() was called via mapping in the service.
    // We can't directly check the mock calls of update because it wasn't awaited individually,
    // but we can check the arguments passed to $transaction.
    
    // Em Prisma mockado, chamamos prisma.dailyLog.update e ele retorna um promise, 
    // mas o vitest spy guarda os argumentos da chamada.
    expect(prisma.dailyLog.update).toHaveBeenCalledWith({
      where: { id: 'log1' },
      data: { primaryValue: 0 },
    });
    
    expect(prisma.dailyLog.update).toHaveBeenCalledWith({
      where: { id: 'log2' },
      data: { primaryValue: 20 },
    });
  });

  it('should ignore remaining penalty if it exceeds total points', async () => {
    // Arrange
    const userId = 'user-123';
    const mockLogs = [
      { id: 'log1', primaryValue: 20 },
    ];

    (prisma.dailyLog.findMany as any).mockResolvedValue(mockLogs);
    (prisma.$transaction as any).mockResolvedValue([]);

    // Act
    // Penalty será (5 + 5 + 5) * 10 = 150
    const result = await logService.registerJacada(userId, { sugar: 5, fat: 5, alcohol: 5 });

    // Assert
    expect(result.penalty).toBe(150);
    expect(result.updatedCount).toBe(1);

    expect(prisma.dailyLog.update).toHaveBeenCalledWith({
      where: { id: 'log1' },
      data: { primaryValue: 0 },
    });
  });

  it('should do nothing if penalty is 0', async () => {
    const result = await logService.registerJacada('user-123', { sugar: 0, fat: 0, alcohol: 0 });
    
    expect(result.penalty).toBe(0);
    expect(result.updatedCount).toBe(0);
    expect(prisma.dailyLog.findMany).not.toHaveBeenCalled();
  });
});
