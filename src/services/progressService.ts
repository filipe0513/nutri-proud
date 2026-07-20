/**
 * progressService.ts
 *
 * Computes the user's health score for each day of the current week
 * (Monday → Sunday, America/Sao_Paulo timezone).
 *
 * IMPORTANT: This service is intentionally thin — it NEVER duplicates score
 * math. All calculation logic is delegated to `historyService.calculateDayScore()`,
 * which is the single source of truth.
 */

import { prisma } from '@/lib/prisma';
import { getLocalStartOfDay, getLocalEndOfDay, getLocalDateKey } from '@/utils/dateUtils';
import { historyService } from './historyService';

// Day-of-week labels in pt-BR, starting at Monday (ISO weekday 1)
const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const;
type DayLabel = (typeof DAY_LABELS)[number];

export interface WeekDay {
  date: Date;
  /** Single-letter day label in pt-BR: S T Q Q S S D */
  dayLabel: DayLabel;
  /**
   * Health score for this day (0–100), or `null` when:
   *  - No logs were recorded (day is empty), OR
   *  - The day is in the future.
   * `null` ≠ `0` — it means "no data", not "bad day".
   */
  score: number | null;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Returns the Monday of the week that contains `referenceDate`,
 * resolved in America/Sao_Paulo timezone.
 */
function getMondayOfWeek(referenceDate: Date): Date {
  // Use Intl to extract the local weekday (0=Sun … 6=Sat) in BRT
  const dayOfWeekFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
  });
  const shortDay = dayOfWeekFmt.format(referenceDate); // 'Sun' | 'Mon' | ...
  const JS_DAY_MAP: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const jsDay = JS_DAY_MAP[shortDay] ?? 0;
  // ISO: Mon=1, ..., Sun=7 → daysFromMonday = (jsDay + 6) % 7
  const daysFromMonday = (jsDay + 6) % 7;

  // Move back to Monday's local start-of-day
  const mondayRef = new Date(referenceDate.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
  return getLocalStartOfDay(mondayRef);
}

/**
 * Computes the weekly progress for a user.
 *
 * @param userId - The authenticated user's ID.
 * @returns Array of 7 `WeekDay` objects (Monday → Sunday, current week, BRT).
 */
export async function getWeeklyProgress(userId: string): Promise<WeekDay[]> {
  const now = new Date();
  const todayKey = getLocalDateKey(now);

  // ── 1. Determine week boundaries (Mon 00:00 → Sun 23:59:59.999 in BRT) ──
  const monday = getMondayOfWeek(now);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  const weekEnd = getLocalEndOfDay(sunday);

  // ── 2. Fetch all logs for the week in a single query ────────────────────
  const weekLogs = await prisma.dailyLog.findMany({
    where: {
      userId,
      eventTime: { gte: monday, lte: weekEnd },
    },
    orderBy: { eventTime: 'asc' },
  });

  // ── 3. Fetch user profile (needed by calculateDayScore) ─────────────────
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { targets: true, profile: true },
  });
  const userProfile = user ?? {};

  // ── 4. Group logs by local date key (YYYY-MM-DD) ─────────────────────────
  const logsByDay = new Map<string, typeof weekLogs>();
  for (const log of weekLogs) {
    const key = getLocalDateKey(new Date(log.eventTime));
    if (!logsByDay.has(key)) logsByDay.set(key, []);
    logsByDay.get(key)!.push(log);
  }

  // ── 5. Build the 7-day array ─────────────────────────────────────────────
  const weekDays: WeekDay[] = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
    const dayKey = getLocalDateKey(dayDate);
    const isToday = dayKey === todayKey;
    const isFuture = dayKey > todayKey;

    const dayLogs = logsByDay.get(dayKey) ?? [];

    let score: number | null = null;
    if (!isFuture) {
      if (dayLogs.length > 0) {
        // Delegate ALL math to the existing single source of truth
        score = historyService.calculateDayScore(dayLogs, userProfile);
      } else if (isToday) {
        // Today with no logs yet → show as 0 (not null) so the UI renders the day
        score = 0;
      }
    }

    weekDays.push({
      date: dayDate,
      dayLabel: DAY_LABELS[i],
      score,
      isToday,
      isFuture,
    });
  }

  return weekDays;
}

export const progressService = { getWeeklyProgress };
