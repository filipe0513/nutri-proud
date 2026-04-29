import { expect, test, vi } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { userService } from '../userService';

// Intercepta a importação do Prisma real e troca pelo nosso Mock
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

test('Deve criar um usuário anônimo corretamente', async () => {
  // Arrange: Prepara a resposta falsa do banco
  const mockUser = { id: '123', is_anonymous: true, email: null };
  prismaMock.user.create.mockResolvedValue(mockUser as unknown as ReturnType<typeof prismaMock.user.create> extends Promise<infer U> ? U : never);

  // Act: Chama o serviço
  const result = await userService.createAnonymousUser();

  // Assert: Verifica se a função tentou salvar com a flag certa e os defaults
  expect(prismaMock.user.create).toHaveBeenCalledWith({
    data: {
      is_anonymous: true,
      name: 'Visitante',
      profile: {},
      targets: {
        water_ml_per_day: 2000,
        meals_per_day: 4,
        sleep_hours_per_night: 8,
        weekly_workouts: { cardio: 3, strength: 3 }
      }
    }
  });
  expect(result.id).toBe('123');
});
