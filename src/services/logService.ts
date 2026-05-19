import { prisma } from '@/lib/prisma';
import { userService } from './userService';

/**
 * Converts a date string to a safe DateTime for the DB.
 * If the string is YYYY-MM-DD (date-only) it sets the time to 12:00 UTC
 * to avoid timezone shifts that could move the date to the previous/next day.
 */
function toSafeEventTime(dateInput: string | undefined): Date {
  if (!dateInput) return new Date();

  // ISO datetime (has 'T') → parse as-is
  if (dateInput.includes('T')) return new Date(dateInput);

  // Date-only string → pin to 12:00 UTC
  return new Date(`${dateInput}T12:00:00.000Z`);
}

export const logService = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveLog(userId: string, logData: any) {
    // 1. Checa as permissões e limites (lançará PermissionError se bloqueado)
    await userService.checkUserPermissions(userId);

    // 2. Salva o registro
    const newLog = await prisma.dailyLog.create({
      data: {
        userId,
        category: logData.category,
        primaryValue: logData.primary_value,
        details: logData.details,
        eventTime: toSafeEventTime(logData.event_time),
      }
    });

    return newLog;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateDailyLog(logId: string, userId: string, logData: any) {
    await userService.checkUserPermissions(userId);

    const updatedLog = await prisma.dailyLog.update({
      where: {
        id: logId,
        userId, // ensure user owns it
      },
      data: {
        category: logData.category,
        primaryValue: logData.primary_value,
        details: logData.details,
        eventTime: toSafeEventTime(logData.event_time),
      }
    });

    return updatedLog;
  },

  async deleteDailyLog(logId: string, userId: string) {
    await prisma.dailyLog.delete({
      where: {
        id: logId,
        userId, // ensure user owns it
      },
    });
  },

  async registerJacada(userId: string, data: { sugar: number; fat: number; alcohol: number }) {
    await userService.checkUserPermissions(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targets: true },
    });

    let targetMealsCount = 4; // default
    if (user?.targets && typeof user.targets === 'object') {
      const targetsObj = user.targets as { planned_meals?: string[] };
      if (Array.isArray(targetsObj.planned_meals) && targetsObj.planned_meals.length > 0) {
        targetMealsCount = targetsObj.planned_meals.length;
      }
    }

    const baseMealValue = 100 / targetMealsCount;
    const sliderSum = data.sugar + data.fat + data.alcohol;
    const penalty = Math.round((sliderSum / 10) * baseMealValue);

    if (penalty === 0) return { penalty, updatedCount: 0 };

    await prisma.dailyLog.create({
      data: {
        userId,
        category: 'jacada',
        primaryValue: penalty, // ou 0, pois a punição é aplicada na comida, mas salva o valor de penalty
        details: data,
        eventTime: new Date(),
      }
    });

    // Pegar o início e o fim do dia atual (no fuso do servidor, o que pode precisar de ajuste,
    // mas usando o mesmo padrão do `toSafeEventTime` ajuda a alinhar os fusos).
    // Para simplificar, consideramos "hoje" como a data de hoje.
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);

    const foodLogs = await prisma.dailyLog.findMany({
      where: {
        userId,
        category: 'food',
        eventTime: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { eventTime: 'asc' },
    });

    let remainingPenalty = penalty;
    const updates: { id: string; primaryValue: number }[] = [];

    for (const log of foodLogs) {
      if (remainingPenalty <= 0) break;

      if (log.primaryValue > 0) {
        const deduct = Math.min(log.primaryValue, remainingPenalty);
        updates.push({
          id: log.id,
          primaryValue: log.primaryValue - deduct,
        });
        remainingPenalty -= deduct;
      }
    }

    if (updates.length > 0) {
      // Execute in a transaction
      await prisma.$transaction(
        updates.map((u) =>
          prisma.dailyLog.update({
            where: { id: u.id },
            data: { primaryValue: u.primaryValue },
          })
        )
      );
    }

    return { penalty, updatedCount: updates.length };
  },
};


