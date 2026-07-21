import { test, expect, vi, describe, beforeEach, Mock } from 'vitest';
import { POST, GET } from './route';
import { logService } from '@/services/logService';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/services/logService', () => ({
  logService: {
    saveLog: vi.fn(),
  },
  getLocalDayInterval: vi.fn().mockReturnValue({
    start: new Date('2026-07-21T00:00:00.000Z'),
    end: new Date('2026-07-21T23:59:59.999Z'),
  }),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyLog: {
      findMany: vi.fn(),
    },
  },
}));

describe('Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('POST /api/logs - success with valid log payload', async () => {
    // Arrange
    (auth as Mock).mockResolvedValue({ user: { id: 'user-123' } });
    (logService.saveLog as Mock).mockResolvedValue({ id: 'log-1', category: 'water' });

    const payload = {
      event_time: '2026-07-21T10:00:00.000Z',
      category: 'water',
      primary_value: 50,
      details: { quantity_ml: 1000 },
    };

    // Act
    const req = new Request('http://localhost/api/logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(201);
    expect(data.message).toBe("Validado e salvo com sucesso!");
    expect(logService.saveLog).toHaveBeenCalledWith('user-123', payload);
  });

  test('GET /api/logs - success', async () => {
    // Arrange
    (auth as Mock).mockResolvedValue({ user: { id: 'user-123' } });
    const mockDbLog = {
      id: 'log-1',
      createdAt: new Date('2026-07-21T10:00:00.000Z'),
      eventTime: new Date('2026-07-21T10:00:00.000Z'),
      category: 'water',
      primaryValue: 50,
      details: { quantity_ml: 1000 },
    };
    (prisma.dailyLog.findMany as Mock).mockResolvedValue([mockDbLog]);

    // Act
    const req = new Request('http://localhost/api/logs?page=1&limit=15');
    const res = await GET(req);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.logs).toHaveLength(1);
    expect(data.logs[0].category).toBe('water');
  });
});
