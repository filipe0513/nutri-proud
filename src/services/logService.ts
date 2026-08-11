import { prisma } from '@/lib/prisma';
import { userService } from './userService';
import { calculateFoodScore } from '@/utils/scoreUtils';
import { getActiveForUser } from './challengeService';
import { generateForUser } from './dailySummaryService';

export function getLocalDayInterval(eventTimeStr: string): { start: Date; end: Date } {
  const tIndex = eventTimeStr.indexOf('T');
  if (tIndex === -1) {
    const dateStr = eventTimeStr;
    // default to America/Sao_Paulo (UTC-3)
    const start = new Date(`${dateStr}T03:00:00.000Z`);
    const end = new Date(`${dateStr}T02:59:59.999Z`);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  const localDateStr = eventTimeStr.slice(0, tIndex);
  let offsetMinutes = -180; // default UTC-3
  const remaining = eventTimeStr.slice(tIndex);
  const offsetMatch = remaining.match(/([+-])(\d{2}):?(\d{2})$/);
  if (offsetMatch) {
    const sign = offsetMatch[1] === '+' ? 1 : -1;
    const hours = parseInt(offsetMatch[2], 10);
    const minutes = parseInt(offsetMatch[3], 10);
    offsetMinutes = sign * (hours * 60 + minutes);
  } else if (remaining.endsWith('Z')) {
    offsetMinutes = 0;
  }

  const start = new Date(new Date(`${localDateStr}T00:00:00.000Z`).getTime() - offsetMinutes * 60000);
  const end = new Date(new Date(`${localDateStr}T23:59:59.999Z`).getTime() - offsetMinutes * 60000);
  
  return { start, end };
}

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


const CHALLENGE_FLAG_MAP: Record<string, 'shareWorkouts' | 'shareMeals' | 'shareWater'> = {
  workout: 'shareWorkouts',
  food: 'shareMeals',
  water: 'shareWater',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildChallengePostContent(logData: any): string {
  const labels: Record<string, string> = {
    workout: 'registrou um treino',
    food: 'registrou uma refeição',
    water: 'registrou ingestão de água',
  };
  return labels[logData.category] ?? 'registrou uma atividade no desafio';
}

export const logService = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveLog(userId: string, logData: any) {
    // 1. Checa as permissões e limites (lançará PermissionError se bloqueado)
    await userService.checkUserPermissions(userId);

    // 2. Check active challenges (read outside tx — acceptable; stale reads are harmless)
    const activeChallenges = await getActiveForUser(userId);

    // 3. Check if this is the first log of today (to trigger yesterday's summary)
    const eventTimeStr: string = logData.event_time || new Date().toISOString();
    const { start: todayStart } = getLocalDayInterval(eventTimeStr);
    const priorLogToday = await prisma.dailyLog.findFirst({
      where: { userId, eventTime: { gte: todayStart } },
      select: { id: true },
    });
    const isFirstLogToday = !priorLogToday;

    // 4. Save the log and create challenge team posts atomically
    const newLog = await prisma.$transaction(async (tx) => {
      const log = await tx.dailyLog.create({
        data: {
          userId,
          category: logData.category,
          primaryValue: logData.primary_value,
          details: logData.details,
          eventTime: toSafeEventTime(logData.event_time),
          source: logData.source || 'UNKNOWN',
        },
      });

      const flag = CHALLENGE_FLAG_MAP[logData.category];
      if (flag) {
        for (const challenge of activeChallenges) {
          if (challenge[flag]) {
            await tx.post.create({
              data: {
                teamId: challenge.teamId,
                authorId: userId,
                content: buildChallengePostContent(logData),
                type: 'SYSTEM_MILESTONE',
              },
            });
          }
        }
      }

      return log;
    });

    // 5. Fire-and-forget: generate yesterday's daily summary on first log of the day
    if (isFirstLogToday) {
      const yesterday = new Date(Date.now() - 86_400_000);
      generateForUser(userId, yesterday).catch(() => {});
    }

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
        source: logData.source || 'UNKNOWN',
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

  async registerJacada(userId: string, data: { sugar: number; fat: number; alcohol: number; event_time?: string }) {
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
        details: { sugar: data.sugar, fat: data.fat, alcohol: data.alcohol },
        eventTime: toSafeEventTime(data.event_time),
      }
    });

    // Pegar o início e o fim do dia atual no fuso do cliente
    const eventTimeStr = data.event_time || new Date().toISOString();
    const { start: todayStart, end: todayEnd } = getLocalDayInterval(eventTimeStr);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculateFoodScore(logs: any[], targets: any): number {
    const plannedMeals = targets?.planned_meals;
    return calculateFoodScore(logs, plannedMeals ?? 3);
  },
};


