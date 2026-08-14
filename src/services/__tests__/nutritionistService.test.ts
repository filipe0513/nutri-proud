import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

import { nutritionistService } from '../nutritionistService';

const mockProfile = {
  id: 'np-1',
  userId: 'user-1',
  displayName: 'Dra. Ana',
  crn: '12345',
  bio: 'Especialista em nutrição esportiva.',
  city: 'São Paulo',
  uf: 'SP',
  whatsapp: '5511999990000',
  publicEmail: 'ana@nutri.com',
  schedulingUrl: 'https://cal.com/ana',
  plansInfo: 'Consulta online e presencial.',
  visibility: 'PUBLIC' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { name: 'Ana', image: null },
};

describe('nutritionistService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('usuário anônimo recebe apenas perfis PUBLIC', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.nutritionistProfile.findMany.mockResolvedValue([mockProfile] as any);

      await nutritionistService.list({ isAuthenticated: false });

      expect(prismaMock.nutritionistProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visibility: { in: ['PUBLIC'] },
          }),
        }),
      );
    });

    it('usuário autenticado recebe PUBLIC e APP_ONLY', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.nutritionistProfile.findMany.mockResolvedValue([mockProfile] as any);

      await nutritionistService.list({ isAuthenticated: true });

      expect(prismaMock.nutritionistProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visibility: { in: ['PUBLIC', 'APP_ONLY'] },
          }),
        }),
      );
    });

    it('filtros de cidade e UF são repassados ao where', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.nutritionistProfile.findMany.mockResolvedValue([] as any);

      await nutritionistService.list({ isAuthenticated: true, city: 'Campinas', uf: 'sp' });

      expect(prismaMock.nutritionistProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: { equals: 'Campinas', mode: 'insensitive' },
            uf: 'SP',
          }),
        }),
      );
    });
  });

  describe('getPublic', () => {
    it('retorna null para perfil HIDDEN (anônimo)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.nutritionistProfile.findFirst.mockResolvedValue(null as any);

      const result = await nutritionistService.getPublic('np-hidden', false);

      expect(result).toBeNull();
      expect(prismaMock.nutritionistProfile.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'np-hidden',
            visibility: { in: ['PUBLIC'] },
          }),
        }),
      );
    });

    it('retorna null para perfil APP_ONLY quando anônimo', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.nutritionistProfile.findFirst.mockResolvedValue(null as any);

      const result = await nutritionistService.getPublic('np-app-only', false);

      expect(result).toBeNull();
      expect(prismaMock.nutritionistProfile.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visibility: { in: ['PUBLIC'] },
          }),
        }),
      );
    });

    it('usuário autenticado pode ver perfil APP_ONLY', async () => {
      const appOnlyProfile = { ...mockProfile, visibility: 'APP_ONLY' as const };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.nutritionistProfile.findFirst.mockResolvedValue(appOnlyProfile as any);

      const result = await nutritionistService.getPublic('np-1', true);

      expect(result).not.toBeNull();
      expect(prismaMock.nutritionistProfile.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visibility: { in: ['PUBLIC', 'APP_ONLY'] },
          }),
        }),
      );
    });
  });
});
