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
  // Desde a Task 32, as metas de refeição são um array de IDs (planned_meals)
  expect(prismaMock.user.create).toHaveBeenCalledWith({
    data: {
      is_anonymous: true,
      name: 'Visitante',
      profile: {},
      targets: {
        water_ml_per_day: 2000,
        planned_meals: ['breakfast', 'lunch', 'afternoon_snack', 'dinner'],
        sleep_hours_per_night: 8,
        weekly_workouts: 3
      }
    }
  });
  expect(result.id).toBe('123');
});

// --- Testes para checkHasCompletedOnboarding ---

test('checkHasCompletedOnboarding: retorna false se o usuário não for encontrado', async () => {
  // Arrange
  prismaMock.user.findUnique.mockResolvedValue(null);

  // Act
  const result = await userService.checkHasCompletedOnboarding('user-404');

  // Assert
  expect(result).toBe(false);
});

test('checkHasCompletedOnboarding: retorna false se profile for nulo', async () => {
  // Arrange
  prismaMock.user.findUnique.mockResolvedValue({ profile: null } as unknown as ReturnType<typeof prismaMock.user.findUnique> extends Promise<infer U> ? U : never);

  // Act
  const result = await userService.checkHasCompletedOnboarding('user-no-profile');

  // Assert
  expect(result).toBe(false);
});

test('checkHasCompletedOnboarding: retorna false se profile existir mas não tiver main_goal', async () => {
  // Arrange
  prismaMock.user.findUnique.mockResolvedValue({ profile: { weight_kg: 70 } } as unknown as ReturnType<typeof prismaMock.user.findUnique> extends Promise<infer U> ? U : never);

  // Act
  const result = await userService.checkHasCompletedOnboarding('user-incomplete');

  // Assert
  expect(result).toBe(false);
});

test('checkHasCompletedOnboarding: retorna true se profile tiver main_goal preenchido', async () => {
  // Arrange
  prismaMock.user.findUnique.mockResolvedValue({ profile: { main_goal: 'fat_loss', weight_kg: 80 } } as unknown as ReturnType<typeof prismaMock.user.findUnique> extends Promise<infer U> ? U : never);

  // Act
  const result = await userService.checkHasCompletedOnboarding('user-complete');

  // Assert
  expect(result).toBe(true);
});
