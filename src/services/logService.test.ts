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

describe('logService.calculateFoodScore', () => {
  it('should calculate food score correctly based on configured planned meals', () => {
    const targets = { planned_meals: ['breakfast', 'lunch', 'dinner', 'supper'] }; // 4 meals
    const logs = [
      { category: 'food', primaryValue: 80 },
      { category: 'food', primaryValue: 90 },
      { category: 'water', primaryValue: 100 }, // other category, should be ignored
    ];

    // Max score = 400. Real score = 80 + 90 = 170.
    // 170 / 400 = 42.5% -> round to 43%
    const score = logService.calculateFoodScore(logs, targets);
    expect(score).toBe(43);
  });

  it('should use fallback of 3 planned meals when planned_meals is not defined or targets is null', () => {
    const logs = [
      { category: 'FOOD', primaryValue: 100 },
      { category: 'food', primaryValue: 50 },
    ];

    // Max score = 300. Real score = 150.
    // 150 / 300 = 50%
    const score = logService.calculateFoodScore(logs, null);
    expect(score).toBe(50);
  });

  it('should correctly support both primaryValue and primary_value keys', () => {
    const targets = { planned_meals: ['breakfast', 'lunch', 'dinner'] }; // 3 meals
    const logs = [
      { category: 'food', primary_value: 90 }, // snake_case
      { category: 'food', primaryValue: 80 },  // camelCase
    ];

    // Max score = 300. Real score = 170.
    // 170 / 300 = 56.67% -> round to 57%
    const score = logService.calculateFoodScore(logs, targets);
    expect(score).toBe(57);
  });

  it('should return 0 when logs array is empty', () => {
    const score = logService.calculateFoodScore([], null);
    expect(score).toBe(0);
  });

  it('should cap the score at 100 and floor at 0', () => {
    const targets = { planned_meals: ['breakfast'] }; // 1 meal
    const logs = [
      { category: 'food', primaryValue: 100 },
      { category: 'food', primaryValue: 50 },
    ];

    // Max score = 100. Real score = 150.
    // Proportional = 150%, should be capped at 100.
    const score = logService.calculateFoodScore(logs, targets);
    expect(score).toBe(100);
  });
});
