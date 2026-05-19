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

describe('reportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a complete report with averages, insights, and notes', async () => {
    const mockLogs: Partial<DailyLog>[] = [
      {
        id: '1',
        userId: 'user1',
        category: 'water',
        primaryValue: 90,
        eventTime: new Date('2026-05-18T10:00:00.000Z'),
        details: {},
      },
      {
        id: '2',
        userId: 'user1',
        category: 'food',
        primaryValue: 30, // Bad day
        eventTime: new Date('2026-05-19T14:00:00.000Z'),
        details: { note: 'Comi muito fast food' },
      },
      {
        id: '3',
        userId: 'user1',
        category: 'workout',
        primaryValue: 100, // Great day
        eventTime: new Date('2026-05-20T18:00:00.000Z'),
        details: {},
      },
    ];

    vi.mocked(prisma.dailyLog.findMany).mockResolvedValue(mockLogs as DailyLog[]);

    const result = await reportService.generateReport(
      'user1',
      '2026-05-18',
      '2026-05-20'
    );

    // Assert total logs and averages
    expect(result.totalLogs).toBe(3);
    // Average: (90 + 30 + 100) / 3 = 73.33 -> 73
    expect(result.averageScore).toBe(73);

    // Verify text content
    const { text } = result;
    
    // Check invite string
    expect(text).toContain('Acompanhe minha evolução diária! Baixe o Orgulho da Nutri em: https://nutri-proud-8d41.vercel.app/');

    // Check categories breakdown
    expect(text).toContain('💧 Água: 90/100');
    expect(text).toContain('🍎 Alimentação: 30/100');
    expect(text).toContain('💪 Treino: 100/100');

    // Check great and tough days (note: timezone could affect the exact date label, but let's check it's formatting)
    // 2026-05-20 is great, 2026-05-19 is tough
    expect(text).toContain('✅ *Dias em Destaque (≥ 85 pts)*');
    expect(text).toContain('⚠️ *Dias Difíceis (< 40 pts)*');

    // Check observations
    expect(text).toContain('📝 *Observações Registradas*');
    expect(text).toContain('Comi muito fast food');
  });

  it('handles empty periods correctly', async () => {
    vi.mocked(prisma.dailyLog.findMany).mockResolvedValue([]);

    const result = await reportService.generateReport(
      'user1',
      '2026-05-18',
      '2026-05-20'
    );

    expect(result.totalLogs).toBe(0);
    expect(result.averageScore).toBe(0);
    expect(result.text).toContain('Nenhum registro encontrado para esse período.');
  });
});
