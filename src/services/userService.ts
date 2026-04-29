import { prisma } from '@/lib/prisma';

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export const userService = {
  async checkUserPermissions(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    // Se for usuário real, acesso liberado
    if (!user.is_anonymous) {
      return true;
    }

    // Validações para Visitante (Anônimo)
    
    // 1. Limite de Tempo (7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (user.createdAt < sevenDaysAgo) {
      throw new PermissionError('Seu período de testes de 7 dias expirou. Crie uma conta grátis para continuar.');
    }

    // 2. Limite de Uso (11 logs)
    const logsCount = await prisma.dailyLog.count({
      where: { userId }
    });

    if (logsCount >= 11) {
      throw new PermissionError('Você atingiu o limite de registros do modo visitante. Crie uma conta grátis para desbloquear.');
    }

    return true;
  },

  async createAnonymousUser() {
    return await prisma.user.create({
      data: {
        is_anonymous: true,
        name: 'Visitante',
        profile: {}, // defaults
        targets: {
            water_ml_per_day: 2000,
            meals_per_day: 4,
            sleep_hours_per_night: 8,
            weekly_workouts: 3
        }
      }
    });
  }
};
