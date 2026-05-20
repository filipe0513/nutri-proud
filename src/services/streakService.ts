import { prisma } from '@/lib/prisma';

const MIN_PRIMARY_VALUE = 70;

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function toDateString(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('/').reverse().join('-');
}

function getLocalDateInBrazil(date: Date): Date {
  return new Date(date.getTime() - 3 * 3600 * 1000);
}


/**
 * Calculates weekly streak for WORKOUT category.
 * A week "counts" if the user logged >= weeklyWorkoutsTarget workouts that week.
 * Streak resets if any completed week fails the target.
 */
export async function calculateWorkoutWeeklyStreak(
  userId: string,
  weeklyWorkoutsTarget: number
): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return 0;

  const logs = await prisma.dailyLog.findMany({
    where: { userId, category: 'WORKOUT' },
    orderBy: { eventTime: 'desc' },
  });

  if (logs.length === 0) return 0;

  // Group logs by ISO week
  const weekMap = new Map<string, number>();
  for (const log of logs) {
    const week = getISOWeek(getLocalDateInBrazil(new Date(log.eventTime)));
    weekMap.set(week, (weekMap.get(week) ?? 0) + 1);
  }

  // Build sorted list of unique weeks (descending), skip current (possibly incomplete) week
  const today = new Date();
  const currentWeek = getISOWeek(getLocalDateInBrazil(today));

  const completedWeeks = Array.from(weekMap.keys())
    .filter((w) => w !== currentWeek)
    .sort()
    .reverse();

  // Count consecutive successful weeks
  let streak = 0;
  let previousWeekNum: { year: number; week: number } | null = null;

  for (const weekStr of completedWeeks) {
    const [yearStr, weekNum] = weekStr.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekNum);

    // Check consecutive: previous week must be exactly 1 week before
    if (previousWeekNum) {
      const expectedPrev = { year, week: week + 1 };
      if (expectedPrev.week > 52) {
        expectedPrev.year -= 1;
        expectedPrev.week = 1;
      }
      if (
        previousWeekNum.year !== expectedPrev.year ||
        previousWeekNum.week !== expectedPrev.week
      ) {
        break; // Gap found, stop
      }
    }

    if ((weekMap.get(weekStr) ?? 0) >= weeklyWorkoutsTarget) {
      streak++;
      previousWeekNum = { year, week };
    } else {
      break; // Failed week, reset
    }
  }

  return streak;
}

/**
 * Calculates daily streak for a specific category (WATER, FOOD, SLEEP, POOP).
 * A day "counts" if there's at least one log with primaryValue >= MIN_PRIMARY_VALUE.
 * Streak resets on any missing or failing day.
 */
export async function calculateDailyStreak(
  userId: string,
  category: string
): Promise<number> {
  const logs = await prisma.dailyLog.findMany({
    where: { userId, category: category.toUpperCase() },
    orderBy: { eventTime: 'desc' },
  });

  if (logs.length === 0) return 0;

  // Group by date: pick the max primaryValue for each day
  const dayMap = new Map<string, number>();
  for (const log of logs) {
    const day = toDateString(new Date(log.eventTime));
    const current = dayMap.get(day) ?? 0;
    if (log.primaryValue > current) {
      dayMap.set(day, log.primaryValue);
    }
  }

  // Walk backwards from yesterday (today may be incomplete)
  let streak = 0;
  const nowInBrazil = getLocalDateInBrazil(new Date());
  const today = new Date(Date.UTC(nowInBrazil.getUTCFullYear(), nowInBrazil.getUTCMonth(), nowInBrazil.getUTCDate()));

  const checkDate = new Date(today);

  checkDate.setDate(checkDate.getDate() - 1); // start from yesterday

  while (true) {
    const dayStr = toDateString(checkDate);
    const val = dayMap.get(dayStr);

    if (val === undefined || val < MIN_PRIMARY_VALUE) break;

    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

export const streakService = { calculateWorkoutWeeklyStreak, calculateDailyStreak };
