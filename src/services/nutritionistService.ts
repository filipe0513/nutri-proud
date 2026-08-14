import { prisma } from '@/lib/prisma';
import { DirectoryVisibility } from '@prisma/client';
import { NutritionistProfileInput } from '@/schemas/nutritionistSchema';

export const nutritionistService = {
  /**
   * Lista perfis visíveis conforme autenticação.
   * Este filtro é o gate real do app — o RLS no Supabase protege apenas
   * acesso direto via chave anon, não queries do Prisma (que usa role privilegiada).
   */
  async list(opts: { city?: string; uf?: string; isAuthenticated: boolean }) {
    const allowed: DirectoryVisibility[] = opts.isAuthenticated
      ? ['PUBLIC', 'APP_ONLY']
      : ['PUBLIC'];

    return prisma.nutritionistProfile.findMany({
      where: {
        visibility: { in: allowed },
        ...(opts.city
          ? { city: { equals: opts.city, mode: 'insensitive' } }
          : {}),
        ...(opts.uf ? { uf: opts.uf.toUpperCase() } : {}),
      },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getPublic(id: string, isAuthenticated: boolean) {
    const allowed: DirectoryVisibility[] = isAuthenticated
      ? ['PUBLIC', 'APP_ONLY']
      : ['PUBLIC'];

    return prisma.nutritionistProfile.findFirst({
      where: { id, visibility: { in: allowed } },
      include: { user: { select: { name: true, image: true } } },
    });
  },

  /** Upsert do próprio perfil. Guard de role deve ocorrer na rota. */
  async upsertOwn(userId: string, data: NutritionistProfileInput) {
    return prisma.nutritionistProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },

  /** Retorna o perfil da nutri pelo userId (para o formulário de edição). */
  async getOwn(userId: string) {
    return prisma.nutritionistProfile.findUnique({ where: { userId } });
  },
};
