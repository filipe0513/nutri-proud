/**
 * Admin Patients Service
 *
 * Aggregated patient/user metrics for the business owner (ADMIN role).
 * All metrics are global — no scope by nutritionist.
 *
 * Depends on:
 *  - src/lib/posthog-server.ts  (queryPostHog)
 *  - src/schemas/analyticsSchema.ts  (DateRange)
 *  - src/services/analyticsShared.ts  (resolveDateRange)
 */

import { prisma } from '@/lib/prisma';
import { queryPostHog } from '@/lib/posthog-server';
import type { DateRange } from '@/schemas/analyticsSchema';
import { resolveDateRange } from '@/services/analyticsShared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RetentionWeek {
  weekOffset: number;
  retainedPct: number;
}

export interface RetentionCohort {
  cohortWeek: string; // "YYYY-Www"
  cohortSize: number;
  weekRetention: RetentionWeek[];
}

export interface AnonymousConversionRate {
  anonSessions: number;
  realLogins: number;
  conversionRatePct: number;
}

export interface PillarDistributionItem {
  pillar: string;
  count: number;
  pct: number;
}

export interface AvgLogsMetric {
  activeUsers: number;
  totalLogs: number;
  avg: number;
}

export interface FunnelStep {
  step: string;
  label: string;
  count: number;
  dropOffPct: number | null;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

const PILLARS = ['water', 'food', 'sleep', 'workout', 'poop'] as const;

function getISOWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Returns the ISO week label for cohortWeek shifted by `offset` weeks.
 * e.g. addWeeks("2026-W33", 1) → "2026-W34"
 */
function addWeeks(isoWeek: string, offset: number): string {
  const [yearStr, weekStr] = isoWeek.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  // Monday of ISO week: derived from Jan 4 which is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(
    jan4.getTime() - (dayOfWeek - 1) * 86_400_000 + (week - 1) * 7 * 86_400_000,
  );
  monday.setUTCDate(monday.getUTCDate() + offset * 7);
  return getISOWeekLabel(monday);
}

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Cohort retention by signup week. For each cohort, returns the % of members
 * who had any DailyLog in weeks 0–4 relative to their cohort week.
 */
export async function getRetentionByCohort(
  range?: Partial<DateRange>,
): Promise<RetentionCohort[]> {
  const { from, to } = resolveDateRange(range);

  const users = await prisma.user.findMany({
    where: {
      is_anonymous: false,
      createdAt: { gte: new Date(from), lte: new Date(to) },
    },
    select: { id: true, createdAt: true },
  });

  if (users.length === 0) return [];

  // Group users by their signup cohort week
  const cohortMap = new Map<string, string[]>();
  for (const user of users) {
    const week = getISOWeekLabel(user.createdAt);
    if (!cohortMap.has(week)) cohortMap.set(week, []);
    cohortMap.get(week)!.push(user.id);
  }

  // Fetch all logs for these users (any category)
  const logs = await prisma.dailyLog.findMany({
    where: { userId: { in: users.map((u) => u.id) } },
    select: { userId: true, eventTime: true },
  });

  // Map: userId → Set of ISO weeks where they logged
  const userWeeks = new Map<string, Set<string>>();
  for (const log of logs) {
    const week = getISOWeekLabel(new Date(log.eventTime));
    if (!userWeeks.has(log.userId)) userWeeks.set(log.userId, new Set());
    userWeeks.get(log.userId)!.add(week);
  }

  const cohorts: RetentionCohort[] = [];
  const MAX_OFFSET = 4;

  for (const [cohortWeek, memberIds] of [...cohortMap.entries()].sort()) {
    const weekRetention: RetentionWeek[] = [];
    for (let offset = 0; offset <= MAX_OFFSET; offset++) {
      const targetWeek = addWeeks(cohortWeek, offset);
      const retained = memberIds.filter((id) => userWeeks.get(id)?.has(targetWeek)).length;
      weekRetention.push({
        weekOffset: offset,
        retainedPct: Math.round((retained / memberIds.length) * 100),
      });
    }
    cohorts.push({ cohortWeek, cohortSize: memberIds.length, weekRetention });
  }

  return cohorts;
}

/**
 * Anonymous conversion rate: ratio of AUTH_LOGIN_SUCCESS to
 * AUTH_ANONYMOUS_SUCCESS events in the range.
 *
 * Note: an approximation — the DB has no explicit anon→real user link.
 * The ratio signals whether the anonymous paywall converts or only blocks.
 */
export async function getAnonymousConversionRate(
  range?: Partial<DateRange>,
): Promise<AnonymousConversionRate> {
  const { from, to } = resolveDateRange(range);
  const dateFilter = { gte: new Date(from), lte: new Date(to) };

  const [anonSessions, realLogins] = await Promise.all([
    prisma.systemEvent.count({
      where: { eventName: 'AUTH_ANONYMOUS_SUCCESS', createdAt: dateFilter },
    }),
    prisma.systemEvent.count({
      where: { eventName: 'AUTH_LOGIN_SUCCESS', createdAt: dateFilter },
    }),
  ]);

  const conversionRatePct =
    anonSessions === 0 ? 0 : Math.round((realLogins / anonSessions) * 100);

  return { anonSessions, realLogins, conversionRatePct };
}

/**
 * DailyLog counts broken down by the 5 health pillars in the range.
 * Pillars with zero logs are included with count: 0 and pct: 0.
 */
export async function getLogsDistributionByPillar(
  range?: Partial<DateRange>,
): Promise<PillarDistributionItem[]> {
  const { from, to } = resolveDateRange(range);

  const groups = await prisma.dailyLog.groupBy({
    by: ['category'],
    where: {
      category: { in: [...PILLARS] },
      eventTime: { gte: new Date(from), lte: new Date(to) },
    },
    _count: { category: true },
  });

  const countByPillar = new Map<string, number>(PILLARS.map((p) => [p, 0]));
  for (const g of groups) {
    countByPillar.set(g.category, g._count.category);
  }

  const total = [...countByPillar.values()].reduce((a, b) => a + b, 0);

  return PILLARS.map((pillar) => {
    const count = countByPillar.get(pillar) ?? 0;
    return {
      pillar,
      count,
      pct: total === 0 ? 0 : Math.round((count / total) * 100),
    };
  });
}

/**
 * Average DailyLogs per active user in the range.
 * "Active" = at least 1 log in the range. Users with no logs are excluded
 * from both numerator and denominator.
 */
export async function getAvgLogsPerActiveUser(
  range?: Partial<DateRange>,
): Promise<AvgLogsMetric> {
  const { from, to } = resolveDateRange(range);

  const groups = await prisma.dailyLog.groupBy({
    by: ['userId'],
    where: { eventTime: { gte: new Date(from), lte: new Date(to) } },
    _count: { userId: true },
  });

  const activeUsers = groups.length;
  const totalLogs = groups.reduce((sum, g) => sum + g._count.userId, 0);
  const avg =
    activeUsers === 0 ? 0 : parseFloat((totalLogs / activeUsers).toFixed(1));

  return { activeUsers, totalLogs, avg };
}

/**
 * Onboarding funnel: /welcome → /onboarding → first habit logged.
 *
 * Steps 1 & 2 use PostHog $pageview events (auto-captured).
 * Step 3 uses DailyLog (unique active users in the range).
 *
 * PostHog event: '$pageview' — always captured regardless of identify state.
 * URL matching: $current_url LIKE pattern (full URL, not just path).
 */
export async function getOnboardingFunnel(
  range?: Partial<DateRange>,
): Promise<FunnelStep[]> {
  const { from, to } = resolveDateRange(range);

  // HogQL requires datetime strings without timezone suffix
  const fromStr = from.replace('T', ' ').replace(/\.\d+Z$/, '').replace('Z', '');
  const toStr = to.replace('T', ' ').replace(/\.\d+Z$/, '').replace('Z', '');

  const buildPageviewQuery = (pathFragment: string) => `
    SELECT count(DISTINCT distinct_id) AS cnt
    FROM events
    WHERE event = '$pageview'
      AND properties.$current_url LIKE '%${pathFragment}%'
      AND timestamp >= toDateTime('${fromStr}')
      AND timestamp <= toDateTime('${toStr}')
  `;

  let welcomeCount = 0;
  let onboardingCount = 0;

  try {
    const [welcomeRows, onboardingRows] = await Promise.all([
      queryPostHog<[number]>(buildPageviewQuery('/welcome')),
      queryPostHog<[number]>(buildPageviewQuery('/onboarding')),
    ]);
    welcomeCount = Number(welcomeRows[0]?.[0] ?? 0);
    onboardingCount = Number(onboardingRows[0]?.[0] ?? 0);
  } catch {
    // PostHog unavailable — degrade gracefully with zeros
  }

  // Step 3: distinct users who logged at least one habit in range
  const firstLogGroups = await prisma.dailyLog.groupBy({
    by: ['userId'],
    where: { eventTime: { gte: new Date(from), lte: new Date(to) } },
  });
  const firstLogCount = firstLogGroups.length;

  return [
    {
      step: 'welcome',
      label: 'Visitou /welcome',
      count: welcomeCount,
      dropOffPct: null,
    },
    {
      step: 'onboarding',
      label: 'Visitou /onboarding',
      count: onboardingCount,
      dropOffPct:
        welcomeCount === 0
          ? 0
          : Math.round(((welcomeCount - onboardingCount) / welcomeCount) * 100),
    },
    {
      step: 'first_log',
      label: 'Registrou primeiro hábito',
      count: firstLogCount,
      dropOffPct:
        onboardingCount === 0
          ? 0
          : Math.round(((onboardingCount - firstLogCount) / onboardingCount) * 100),
    },
  ];
}
