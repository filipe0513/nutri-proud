import { prisma } from '@/lib/prisma';
import { getLocalStartOfDay } from '@/utils/dateUtils';
import { getWeeklyProgress } from './progressService';
import type { DailyLog } from '@prisma/client';

type UserTargets = {
  water_ml_per_day?: number;
  sleep_hours_per_night?: number;
  workouts_per_week?: number;
  meals_per_day?: number;
};

type UserProfile = {
  main_goal?: string;
};

export interface PatientContext {
  targets: UserTargets;
  profile: UserProfile;
  last30Logs: DailyLog[];
  todayLogs: DailyLog[];
  weeklyProgress: Awaited<ReturnType<typeof getWeeklyProgress>>;
  waterGoalMl: number;
  sleepGoalHours: number;
  workoutGoalPerWeek: number;
  mealsGoalPerDay: number;
  mainGoal: string;
  waterMlToday: number;
  waterPctToday: number;
  mealsToday: number;
  lastSleepScore: number | null;
  workoutsThisWeek: number;
  daysSinceLastWorkout: number | null;
  weeklyFrequency: Record<string, number>;
  currentStreak: number;
  yesterdayScore: number | null;
}

export async function getPatientContext(userId: string): Promise<PatientContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { targets: true, profile: true },
  });

  const targets = (user?.targets ?? {}) as UserTargets;
  const profile = (user?.profile ?? {}) as UserProfile;

  const waterGoalMl = targets.water_ml_per_day ?? 2500;
  const sleepGoalHours = targets.sleep_hours_per_night ?? 8;
  const workoutGoalPerWeek = targets.workouts_per_week ?? 3;
  const mealsGoalPerDay = targets.meals_per_day ?? 3;
  const mainGoal = profile.main_goal ?? 'health';

  const last30Logs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { eventTime: 'desc' },
    take: 30,
  });

  const dayStart = getLocalStartOfDay();
  const todayLogs = last30Logs.filter((l) => new Date(l.eventTime) >= dayStart);

  const ALL_CATEGORIES = ['WATER', 'FOOD', 'SLEEP', 'WORKOUT', 'POOP'];

  // Water today
  const waterLogsToday = todayLogs.filter((l) => l.category.toLowerCase() === 'water');
  const waterPctToday = waterLogsToday.reduce((sum, l) => sum + l.primaryValue, 0);
  const waterMlToday = Math.round((waterPctToday / 100) * waterGoalMl);

  // Meals today
  const mealsToday = todayLogs.filter((l) => l.category.toLowerCase() === 'food').length;

  // Last sleep score
  const lastSleepLog = last30Logs.find((l) => l.category.toLowerCase() === 'sleep');
  const lastSleepScore = lastSleepLog ? lastSleepLog.primaryValue : null;

  // Workouts this week
  const sevenDaysAgo = new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const workoutsThisWeek = last30Logs.filter(
    (l) => l.category.toLowerCase() === 'workout' && new Date(l.eventTime) >= sevenDaysAgo,
  ).length;

  // Days since last workout
  const lastWorkoutLog = last30Logs.find((l) => l.category.toLowerCase() === 'workout');
  const daysSinceLastWorkout = lastWorkoutLog
    ? Math.floor((Date.now() - new Date(lastWorkoutLog.eventTime).getTime()) / 86_400_000)
    : null;

  // Weekly frequency
  const weeklyFrequency: Record<string, number> = {};
  for (const cat of ALL_CATEGORIES) {
    weeklyFrequency[cat] = last30Logs.filter(
      (l) => l.category.toUpperCase() === cat && new Date(l.eventTime) >= sevenDaysAgo,
    ).length;
  }

  // Weekly progress + streak
  const weeklyProgress = await getWeeklyProgress(userId);
  const completedDays = weeklyProgress.filter((d) => !d.isFuture && !d.isToday);
  let currentStreak = 0;
  for (let idx = completedDays.length - 1; idx >= 0; idx--) {
    if ((completedDays[idx].score ?? 0) >= 70) {
      currentStreak++;
    } else {
      break;
    }
  }
  const yesterdayDay = completedDays[completedDays.length - 1];
  const yesterdayScore = yesterdayDay?.score ?? null;

  return {
    targets,
    profile,
    last30Logs,
    todayLogs,
    weeklyProgress,
    waterGoalMl,
    sleepGoalHours,
    workoutGoalPerWeek,
    mealsGoalPerDay,
    mainGoal,
    waterMlToday,
    waterPctToday,
    mealsToday,
    lastSleepScore,
    workoutsThisWeek,
    daysSinceLastWorkout,
    weeklyFrequency,
    currentStreak,
    yesterdayScore,
  };
}
