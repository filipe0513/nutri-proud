import { expect, test, vi } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { userService } from '../userService';

// Intercepta a importação do Prisma real e troca pelo nosso Mock
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

// Mock do squadService para isolar testes de userService
vi.mock('@/services/squadService', () => ({
  createSquad: vi.fn().mockResolvedValue({
    id: 'squad-abc',
    name: 'Squad da Dra. Ana',
    description: null,
    inviteCode: 'invite-xyz',
    memberCount: 1,
    createdAt: new Date().toISOString(),
  }),
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

// --- Testes para promoteToNutritionist ---

test('promoteToNutritionist: lança erro se usuário não existir', async () => {
  // Arrange
  prismaMock.user.findUnique.mockResolvedValue(null);

  // Act & Assert
  await expect(
    userService.promoteToNutritionist('user-inexistente')
  ).rejects.toThrow('Usuário não encontrado.');
});

test('promoteToNutritionist: lança erro se usuário for anônimo', async () => {
  // Arrange
  prismaMock.user.findUnique.mockResolvedValue({
    id: 'anon-1', name: null, role: 'USER', is_anonymous: true,
  } as unknown as ReturnType<typeof prismaMock.user.findUnique> extends Promise<infer U> ? U : never);

  // Act & Assert
  await expect(
    userService.promoteToNutritionist('anon-1')
  ).rejects.toThrow('Não é possível promover um usuário anônimo.');
});

test('promoteToNutritionist: lança erro se usuário já for NUTRITIONIST', async () => {
  // Arrange
  prismaMock.user.findUnique.mockResolvedValue({
    id: 'nutri-1', name: 'Dra. Ana', role: 'NUTRITIONIST', is_anonymous: false,
  } as unknown as ReturnType<typeof prismaMock.user.findUnique> extends Promise<infer U> ? U : never);

  // Act & Assert
  await expect(
    userService.promoteToNutritionist('nutri-1')
  ).rejects.toThrow('Usuário já é Nutricionista.');
});

test('promoteToNutritionist: lança erro se usuário for ADMIN', async () => {
  // Arrange
  prismaMock.user.findUnique.mockResolvedValue({
    id: 'admin-1', name: 'Admin', role: 'ADMIN', is_anonymous: false,
  } as unknown as ReturnType<typeof prismaMock.user.findUnique> extends Promise<infer U> ? U : never);

  // Act & Assert
  await expect(
    userService.promoteToNutritionist('admin-1')
  ).rejects.toThrow('Não é possível alterar a role de um Admin.');
});

test('promoteToNutritionist: executa provisionamento completo e retorna o inviteCode', async () => {
  // Arrange
  prismaMock.user.findUnique.mockResolvedValue({
    id: 'user-1', name: 'Dra. Ana', role: 'USER', is_anonymous: false,
  } as unknown as ReturnType<typeof prismaMock.user.findUnique> extends Promise<infer U> ? U : never);
  prismaMock.user.update.mockResolvedValue({} as never);
  prismaMock.systemEvent.create.mockResolvedValue({} as never);

  // Act
  const result = await userService.promoteToNutritionist('user-1');

  // Assert — role e targets atualizados
  // Nota: targets usa Prisma.DbNull para limpar o campo JSON no banco
  expect(prismaMock.user.update).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data: expect.objectContaining({
      role: 'NUTRITIONIST',
      profile: { onboarding_skipped: true },
    }),
  });

  // Assert — evento de auditoria registrado
  expect(prismaMock.systemEvent.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user-1',
        eventName: 'ROLE_PROMOTED_NUTRITIONIST',
      }),
    })
  );

  // Assert — retorna o invite code do squad criado
  expect(result.squadInviteCode).toBe('invite-xyz');
});
