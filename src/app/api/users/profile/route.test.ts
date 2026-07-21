import { test, expect, vi, describe, beforeEach } from 'vitest';
import { POST, GET } from './route';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('GET /api/users/profile - user exists', async () => {
    // Arrange
    (auth as any).mockResolvedValue({ user: { id: 'user-123' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user-123', profile: { weight_kg: 70 } });

    // Act
    const req = new Request('http://localhost/api/users/profile');
    const res = await GET();
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.profile).toBeDefined();
    expect(data.profile.id).toBe('user-123');
  });

  test('POST /api/users/profile - success with correct payload', async () => {
    // Arrange
    (auth as any).mockResolvedValue({ user: { id: 'user-123' } });
    (prisma.user.update as any).mockResolvedValue({ id: 'user-123' });

    const payload = {
      name: 'Filipe',
      profile: {
        weight_kg: 70,
        height_cm: 170,
        main_goal: 'health',
      },
      targets: {
        water_ml_per_day: 2000,
        planned_meals: ['breakfast', 'lunch'],
        sleep_hours_per_night: 8,
        weekly_workouts: 4,
      }
    };

    // Act
    const req = new Request('http://localhost/api/users/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.message).toBe("Perfil salvo com sucesso!");
    expect(prisma.user.update).toHaveBeenCalled();
  });

  test('POST /api/users/profile - fails with flat payload (old bug)', async () => {
    // Arrange
    (auth as any).mockResolvedValue({ user: { id: 'user-123' } });

    const payload = {
      name: 'Filipe',
      weight_kg: 70,
      height_cm: 170,
      goal: 'health',
      water_target_ml: 2000,
      planned_meals: ['breakfast', 'lunch'],
      sleep_target_hours: 8,
      weekly_workouts: 4,
    };

    // Act
    const req = new Request('http://localhost/api/users/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(data.error).toBe('Dados inválidos.');
  });
});
