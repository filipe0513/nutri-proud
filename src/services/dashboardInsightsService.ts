/**
 * Dashboard Insights Service
 *
 * Enriches the nutritionist dashboard with patient-level health insights.
 * Every function receives `nutriId` and resolves patient scope internally —
 * no raw patient list is accepted from callers (prevents cross-nutri data leaks).
 *
 * Scope: patients are TeamMember rows with role MEMBER in teams where the
 * nutritionist is TeamMember with role ADMIN.
 */

import { prisma } from '@/lib/prisma';
import { queryPostHog } from '@/lib/posthog-server';
import { getLocalDateKey } from '@/utils/dateUtils';
import type { DateRange } from '@/schemas/analyticsSchema';
import { resolveDateRange } from '@/services/analyticsShared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatientSummary {
  id: string;
  name: string | null;
  image: string | null;
  teamName: string;
}

export interface GoalAdherenceItem extends PatientSummary {
  waterAdherencePct: number | null;
  sleepAdherencePct: number | null;
}

export interface BrokenStreakItem extends PatientSummary {
  daysSinceLastLog: number;
}

export interface PillarRankItem {
  pillar: string;
  logCount: number;
  rank: number;
}

export interface DisengagedPatientItem extends PatientSummary {
  daysSinceLastEngagement: number;
}

export interface InactivePatientItem extends PatientSummary {
  daysSinceLastSeen: number;
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

interface PatientRecord {
  userId: string;
  name: string | null;
  image: string | null;
  teamName: string;
  targets: {
    water_ml_per_day?: number;
    sleep_hours_per_night?: number;
  } | null;
}

/**
 * Resolves all patients (MEMBER role) in teams where `nutriId` is ADMIN.
 * This is the single source of truth for scope — never expose patient list raw.
 */
async function resolvePatients(nutriId: string): Promise<PatientRecord[]> {
  const adminMemberships = await prisma.teamMember.findMany({
    where: { userId: nutriId, role: 'ADMIN' },
    include: { team: { select: { id: true, name: true } } },
  });

  if (adminMemberships.length === 0) return [];

  const teamIds = adminMemberships.map((m) => m.teamId);
  const teamNameMap = new Map(adminMemberships.map((m) => [m.teamId, m.team.name]));

  const members = await prisma.teamMember.findMany({
    where: {
      teamId: { in: teamIds },
      role: 'MEMBER',
    },
    include: {
      user: { select: { id: true, name: true, image: true, targets: true } },
    },
  });

  // Deduplicate by userId (patient may be in multiple teams — use first occurrence)
  const seen = new Set<string>();
  const patients: PatientRecord[] = [];

  for (const m of members) {
    if (seen.has(m.user.id)) continue;
    seen.add(m.user.id);
    patients.push({
      userId: m.user.id,
      name: m.user.name,
      image: m.user.image,
      teamName: teamNameMap.get(m.teamId) ?? '',
      targets: m.user.targets as PatientRecord['targets'],
    });
  }

  return patients;
}

function toPatientSummary(p: PatientRecord): PatientSummary {
  return { id: p.userId, name: p.name, image: p.image, teamName: p.teamName };
}

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Returns goal adherence (water + sleep) for each patient in the range.
 * Patients without defined targets return null for the respective metric.
 */
export async function getPatientGoalAdherence(
  nutriId: string,
  range?: Partial<DateRange>,
): Promise<GoalAdherenceItem[]> {
  const { from, to } = resolveDateRange(range);
  const patients = await resolvePatients(nutriId);
  if (patients.length === 0) return [];

  const patientIds = patients.map((p) => p.userId);

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: { in: patientIds },
      category: { in: ['water', 'sleep'] },
      eventTime: { gte: new Date(from), lte: new Date(to) },
    },
    select: { userId: true, category: true, primaryValue: true, eventTime: true },
  });

  // Calculate total days in range
  const totalDays = Math.max(
    1,
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000),
  );

  // Group logs per patient per category per day, keeping max primaryValue per day
  type DayMap = Map<string, number>; // dateKey → maxPrimaryValue
  const waterByPatient = new Map<string, DayMap>();
  const sleepByPatient = new Map<string, DayMap>();

  for (const log of logs) {
    const dayKey = getLocalDateKey(new Date(log.eventTime));
    const map = log.category === 'water' ? waterByPatient : sleepByPatient;
    if (!map.has(log.userId)) map.set(log.userId, new Map());
    const dayMap = map.get(log.userId)!;
    const current = dayMap.get(dayKey) ?? 0;
    if (log.primaryValue > current) dayMap.set(dayKey, log.primaryValue);
  }

  return patients.map((p) => {
    const waterTarget = p.targets?.water_ml_per_day;
    const sleepTarget = p.targets?.sleep_hours_per_night;

    // Water: primaryValue is stored in ml
    let waterAdherencePct: number | null = null;
    if (waterTarget != null) {
      const daysMap = waterByPatient.get(p.userId);
      const hitDays = daysMap
        ? [...daysMap.values()].filter((v) => v >= waterTarget).length
        : 0;
      waterAdherencePct = Math.round((hitDays / totalDays) * 100);
    }

    // Sleep: primaryValue is stored in minutes, target is in hours
    let sleepAdherencePct: number | null = null;
    if (sleepTarget != null) {
      const sleepTargetMinutes = sleepTarget * 60;
      const daysMap = sleepByPatient.get(p.userId);
      const hitDays = daysMap
        ? [...daysMap.values()].filter((v) => v >= sleepTargetMinutes).length
        : 0;
      sleepAdherencePct = Math.round((hitDays / totalDays) * 100);
    }

    return { ...toPatientSummary(p), waterAdherencePct, sleepAdherencePct };
  });
}

/**
 * Returns patients with a broken streak — no log recorded in the last 2+ days.
 * Uses the same "day without log = broken" logic as streakService.
 */
export async function getBrokenStreaks(nutriId: string): Promise<BrokenStreakItem[]> {
  const patients = await resolvePatients(nutriId);
  if (patients.length === 0) return [];

  const patientIds = patients.map((p) => p.userId);

  // Fetch the most recent log per patient (any category except system ones)
  const recentLogs = await prisma.dailyLog.findMany({
    where: {
      userId: { in: patientIds },
      category: { in: ['water', 'sleep', 'food', 'workout', 'poop'] },
    },
    orderBy: { eventTime: 'desc' },
    distinct: ['userId'],
    select: { userId: true, eventTime: true },
  });

  const lastLogByPatient = new Map(recentLogs.map((l) => [l.userId, l.eventTime]));

  const todayKey = getLocalDateKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterdayDate);

  const broken: BrokenStreakItem[] = [];

  for (const p of patients) {
    const lastLog = lastLogByPatient.get(p.userId);
    if (!lastLog) {
      // Never logged — definitely broken, treat as very stale
      broken.push({ ...toPatientSummary(p), daysSinceLastLog: 999 });
      continue;
    }

    const lastDayKey = getLocalDateKey(new Date(lastLog));

    // If last log was today or yesterday, streak is intact
    if (lastDayKey === todayKey || lastDayKey === yesterdayKey) continue;

    const daysSince = Math.floor(
      (new Date().getTime() - new Date(lastLog).getTime()) / 86_400_000,
    );
    broken.push({ ...toPatientSummary(p), daysSinceLastLog: daysSince });
  }

  return broken.sort((a, b) => b.daysSinceLastLog - a.daysSinceLastLog);
}

/**
 * Returns the 5 pillars ranked from weakest (fewest logs / lowest engagement)
 * to strongest within the nutri's patient base and the given date range.
 */
export async function getTeamWeakestPillars(
  nutriId: string,
  range?: Partial<DateRange>,
): Promise<PillarRankItem[]> {
  const { from, to } = resolveDateRange(range);
  const patients = await resolvePatients(nutriId);
  if (patients.length === 0) {
    return ['water', 'food', 'sleep', 'workout', 'poop'].map((pillar, i) => ({
      pillar,
      logCount: 0,
      rank: i + 1,
    }));
  }

  const patientIds = patients.map((p) => p.userId);
  const pillars = ['water', 'food', 'sleep', 'workout', 'poop'];

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: { in: patientIds },
      category: { in: pillars },
      eventTime: { gte: new Date(from), lte: new Date(to) },
    },
    select: { category: true },
  });

  const countByPillar = new Map<string, number>(pillars.map((p) => [p, 0]));
  for (const log of logs) {
    countByPillar.set(log.category, (countByPillar.get(log.category) ?? 0) + 1);
  }

  const sorted = pillars
    .map((pillar) => ({ pillar, logCount: countByPillar.get(pillar) ?? 0 }))
    .sort((a, b) => a.logCount - b.logCount);

  return sorted.map((item, i) => ({ ...item, rank: i + 1 }));
}

/**
 * Returns patients who haven't reacted or commented in the last `days` days.
 * Social engagement is tracked via DB (Reaction.createdAt, Comment.createdAt).
 */
export async function getSocialDisengagement(
  nutriId: string,
  days = 7,
): Promise<DisengagedPatientItem[]> {
  const patients = await resolvePatients(nutriId);
  if (patients.length === 0) return [];

  const patientIds = patients.map((p) => p.userId);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Fetch latest reaction and comment per patient in one query each
  const [recentReactions, recentComments] = await Promise.all([
    prisma.reaction.findMany({
      where: { userId: { in: patientIds }, createdAt: { gte: cutoff } },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      select: { userId: true, createdAt: true },
    }),
    prisma.comment.findMany({
      where: { userId: { in: patientIds }, createdAt: { gte: cutoff } },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      select: { userId: true, createdAt: true },
    }),
  ]);

  const activeIds = new Set([
    ...recentReactions.map((r) => r.userId),
    ...recentComments.map((c) => c.userId),
  ]);

  // For disengaged patients, find their last engagement (could be older than cutoff)
  const disengagedIds = patientIds.filter((id) => !activeIds.has(id));
  if (disengagedIds.length === 0) return [];

  const [lastReactions, lastComments] = await Promise.all([
    prisma.reaction.findMany({
      where: { userId: { in: disengagedIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      select: { userId: true, createdAt: true },
    }),
    prisma.comment.findMany({
      where: { userId: { in: disengagedIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      select: { userId: true, createdAt: true },
    }),
  ]);

  const lastEngagement = new Map<string, Date>();
  for (const r of lastReactions) {
    const existing = lastEngagement.get(r.userId);
    if (!existing || r.createdAt > existing) lastEngagement.set(r.userId, r.createdAt);
  }
  for (const c of lastComments) {
    const existing = lastEngagement.get(c.userId);
    if (!existing || c.createdAt > existing) lastEngagement.set(c.userId, c.createdAt);
  }

  const result: DisengagedPatientItem[] = [];

  for (const p of patients) {
    if (!disengagedIds.includes(p.userId)) continue;
    const last = lastEngagement.get(p.userId);
    const daysSince = last
      ? Math.floor((new Date().getTime() - last.getTime()) / 86_400_000)
      : 999;
    result.push({ ...toPatientSummary(p), daysSinceLastEngagement: daysSince });
  }

  return result.sort((a, b) => b.daysSinceLastEngagement - a.daysSinceLastEngagement);
}

/**
 * Returns patients who haven't opened the app in the last `days` days.
 * App activity is determined by PostHog session/pageview events.
 */
export async function getInactivePatients(
  nutriId: string,
  days = 7,
): Promise<InactivePatientItem[]> {
  const patients = await resolvePatients(nutriId);
  if (patients.length === 0) return [];

  const patientIds = patients.map((p) => p.userId);

  // HogQL: for each distinct_id in the patient list, find the max timestamp
  // of any $pageview or $session_start event in the last 60 days.
  // We query 60 days to find the last seen date — not just within `days`.
  const idList = patientIds.map((id) => `'${id}'`).join(', ');
  const hogql = `
    SELECT
      distinct_id,
      max(timestamp) AS last_seen
    FROM events
    WHERE
      event IN ('$pageview', '$session_start')
      AND distinct_id IN (${idList})
      AND timestamp >= now() - toIntervalDay(60)
    GROUP BY distinct_id
  `;

  let posthogRows: [string, string][] = [];
  try {
    posthogRows = await queryPostHog<[string, string]>(hogql);
  } catch {
    // PostHog unavailable — treat all patients as active to avoid false alerts
    return [];
  }

  const lastSeenMap = new Map<string, Date>(
    posthogRows.map(([id, ts]) => [id, new Date(ts)]),
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result: InactivePatientItem[] = [];

  for (const p of patients) {
    const lastSeen = lastSeenMap.get(p.userId);
    // If never seen in PostHog or last seen before cutoff → inactive
    if (!lastSeen || lastSeen < cutoff) {
      const daysSince = lastSeen
        ? Math.floor((new Date().getTime() - lastSeen.getTime()) / 86_400_000)
        : 999;
      result.push({ ...toPatientSummary(p), daysSinceLastSeen: daysSince });
    }
  }

  return result.sort((a, b) => b.daysSinceLastSeen - a.daysSinceLastSeen);
}

export const dashboardInsightsService = {
  getPatientGoalAdherence,
  getBrokenStreaks,
  getTeamWeakestPillars,
  getSocialDisengagement,
  getInactivePatients,
};
