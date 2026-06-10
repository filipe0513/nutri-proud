import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportService } from '../reportService';
import { prisma } from '@/lib/prisma';
import { DailyLog } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyLog: {
      findMany: vi.fn(),
    },
  },
}));

// Helper targets used across tests
const defaultTargets = {
  water_ml_per_day: 2000,
  planned_meals: ['breakfast', 'lunch', 'dinner'],
  sleep_hours_per_night: 8,
};

describe('reportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a complete report with correct water aggregation (bug fix)', async () => {
    // Bug: Previously water was averaging per-log primaryValue instead of summing ml first.
    // This test validates that two water logs on the same day are aggregated correctly.
    const mockLogs: Partial<DailyLog>[] = [
      {
        id: '1',
        userId: 'user1',
        category: 'water',
        primaryValue: 25, // 500ml / 2000ml * 100 = 25
        eventTime: new Date('2026-05-20T08:00:00.000Z'),
        details: { quantity_ml: 500 },
      },
      {
        id: '2',
        userId: 'user1',
        category: 'water',
        primaryValue: 50, // 1000ml / 2000ml * 100 = 50
        eventTime: new Date('2026-05-20T12:00:00.000Z'),
        details: { quantity_ml: 1000 },
      },
    ];

    vi.mocked(prisma.dailyLog.findMany).mockResolvedValue(mockLogs as DailyLog[]);

    const result = await reportService.generateReport(
      'user1',
      '2026-05-20',
      '2026-05-20',
      defaultTargets
    );

    // With correct aggregation: totalMl = 1500, target = 2000 → score = 75
    // OLD broken behaviour would average (25 + 50) / 2 = 37 — wrong!
    expect(result.text).toContain('💧 Água: 75/100');
  });

  it('generates a complete report with averages, insights, and notes', async () => {
    const mockLogs: Partial<DailyLog>[] = [
      {
        id: '1',
        userId: 'user1',
        category: 'water',
        primaryValue: 90,
        eventTime: new Date('2026-05-18T10:00:00.000Z'),
        details: { quantity_ml: 1800 }, // 1800/2000 = 90%
      },
      {
        id: '2',
        userId: 'user1',
        category: 'food',
        primaryValue: 30,
        eventTime: new Date('2026-05-19T14:00:00.000Z'),
        details: { note: 'Comi muito fast food' },
      },
      {
        id: '3',
        userId: 'user1',
        category: 'workout',
        primaryValue: 100,
        eventTime: new Date('2026-05-20T18:00:00.000Z'),
        details: { factors: { cardio: 0, carga: 0 } },
      },
    ];

    vi.mocked(prisma.dailyLog.findMany).mockResolvedValue(mockLogs as DailyLog[]);

    const result = await reportService.generateReport(
      'user1',
      '2026-05-18',
      '2026-05-20',
      defaultTargets
    );

    expect(result.totalLogs).toBe(3);

    // Verify text content
    const { text } = result;

    // Check invite string
    expect(text).toContain('Acompanhe minha evolução diária! Baixe o Orgulho da Nutri em: https://nutri-proud-8d41.vercel.app/');

    // Check categories breakdown (workout 100 → calcTrainingScore(0,0) = 100)
    expect(text).toContain('💪 Treino: 100/100');

    // Check observations from note field
    expect(text).toContain('📝 *Observações Registradas*');
    expect(text).toContain('Comi muito fast food');
  });

  it('handles empty periods correctly', async () => {
    vi.mocked(prisma.dailyLog.findMany).mockResolvedValue([]);

    const result = await reportService.generateReport(
      'user1',
      '2026-05-18',
      '2026-05-20',
      defaultTargets
    );

    expect(result.totalLogs).toBe(0);
    expect(result.averageScore).toBe(0);
    expect(result.text).toContain('Nenhum registro encontrado para esse período.');
  });
});
