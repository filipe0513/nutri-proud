/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logService } from './logService';
import { prisma } from '@/lib/prisma';
import { userService } from './userService';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
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

    (prisma.user.findUnique as any).mockResolvedValue({
      targets: { planned_meals: ['breakfast', 'lunch', 'afternoon_snack', 'dinner'] },
    });
    (prisma.dailyLog.findMany as any).mockResolvedValue(mockLogs);
    
    // Simula a transação simplesmente retornando os resultados
    (prisma.$transaction as any).mockImplementation((updates: any) => Promise.resolve(updates));

    // Act
    // Slider sum = 1 + 3 + 4 = 8.
    // Com 4 refeições planejadas, baseMealValue = 25.
    // Penalty = Math.round((8 / 10) * 25) = Math.round(20) = 20.
    const result = await logService.registerJacada(userId, { sugar: 1, fat: 3, alcohol: 4 });

    // Assert
    expect(userService.checkUserPermissions).toHaveBeenCalledWith(userId);
    expect(result.penalty).toBe(20);
    expect(result.updatedCount).toBe(1);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    
    // Verifica se os updates gerados estão corretos.
    // O primeiro log (60 pts) deve ter 20 pts deduzidos (ficando 40).
    const transactionArg = (prisma.$transaction as any).mock.calls[0][0];
    
    expect(transactionArg).toHaveLength(1);
    
    expect(prisma.dailyLog.update).toHaveBeenCalledWith({
      where: { id: 'log1' },
      data: { primaryValue: 40 },
    });
  });

  it('should ignore remaining penalty if it exceeds total points', async () => {
    // Arrange
    const userId = 'user-123';
    const mockLogs = [
      { id: 'log1', primaryValue: 20 },
    ];

    (prisma.user.findUnique as any).mockResolvedValue({
      targets: { planned_meals: ['breakfast', 'lunch', 'afternoon_snack', 'dinner'] },
    });
    (prisma.dailyLog.findMany as any).mockResolvedValue(mockLogs);
    (prisma.$transaction as any).mockResolvedValue([]);

    // Act
    // Slider sum = 5 + 5 + 5 = 15.
    // Com 4 refeições, baseMealValue = 25.
    // Penalty = Math.round((15 / 10) * 25) = Math.round(37.5) = 38.
    const result = await logService.registerJacada(userId, { sugar: 5, fat: 5, alcohol: 5 });

    // Assert
    expect(result.penalty).toBe(38);
    expect(result.updatedCount).toBe(1);

    expect(prisma.dailyLog.update).toHaveBeenCalledWith({
      where: { id: 'log1' },
      data: { primaryValue: 0 },
    });
  });

  it('should do nothing if penalty is 0', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      targets: { planned_meals: ['breakfast', 'lunch', 'afternoon_snack', 'dinner'] },
    });
    const result = await logService.registerJacada('user-123', { sugar: 0, fat: 0, alcohol: 0 });
    
    expect(result.penalty).toBe(0);
    expect(result.updatedCount).toBe(0);
    expect(prisma.dailyLog.findMany).not.toHaveBeenCalled();
  });
});
