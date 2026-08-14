/**
 * Admin Nutri Service
 *
 * Business health metrics scoped by nutritionist.
 * Nutritionist = TeamMember with role 'ADMIN' (team owner).
 * Patients      = TeamMember with role 'MEMBER' in those teams.
 *
 * Depends on:
 *  - src/schemas/analyticsSchema.ts  (DateRange)
 *  - src/services/analyticsShared.ts  (resolveDateRange)
 */

import { prisma } from '@/lib/prisma';
import type { DateRange } from '@/schemas/analyticsSchema';
import { resolveDateRange } from '@/services/analyticsShared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NutriActivationRow {
  nutriId: string;
  nutriName: string;
  invited: number;
  activated: number;
  activationRatePct: number;
}

export interface NutriRetentionRow {
  nutriId: string;
  nutriName: string;
  totalPatients: number;
  retainedPatients: number;
  retentionPct: number;
}

export interface PlanDistributionItem {
  plan: string;
  count: number;
}

export interface PlanDistributionResult {
  distribution: PlanDistributionItem[];
  /** Always false — no plan change history exists in SystemEvent yet. */
  upgradeHistoryAvailable: boolean;
}

export interface NutriEngagementRow {
  nutriId: string;
  nutriName: string;
  totalPatients: number;
  avgLogsPerPatient: number;
}

// ─── Internal Types ────────────────────────────────────────────────────────────

interface PatientEntry {
  userId: string;
  joinedAt: Date;
}

interface NutriEntry {
  nutriId: string;
  nutriName: string;
  patients: PatientEntry[];
}

// ─── Internal Helper ──────────────────────────────────────────────────────────

/**
 * Fetches all nutritionist→patient mappings from TeamMember.
 * De-duplicates patients who appear in multiple teams of the same nutritionist.
 * If a patient appears in multiple teams, the earliest joinedAt is kept.
 */
async function fetchNutriPatientMappings(options?: {
  joinedFrom?: Date;
  joinedTo?: Date;
}): Promise<NutriEntry[]> {
  const admins = await prisma.teamMember.findMany({
    where: { role: 'ADMIN' },
    select: {
      userId: true,
      user: { select: { name: true, email: true } },
      team: {
        select: {
          members: {
            where: { role: 'MEMBER' },
            select: { userId: true, joinedAt: true },
          },
        },
      },
    },
  });

  // Aggregate by nutriId — de-duplicate patients across multiple teams
  const nutriMap = new Map<
    string,
    { name: string; patientsMap: Map<string, Date> }
  >();

  for (const admin of admins) {
    if (!nutriMap.has(admin.userId)) {
      nutriMap.set(admin.userId, {
        name: admin.user.name ?? admin.user.email ?? admin.userId,
        patientsMap: new Map(),
      });
    }
    const entry = nutriMap.get(admin.userId)!;

    for (const member of admin.team.members) {
      // Apply optional joinedAt range filter in-memory
      if (options?.joinedFrom && member.joinedAt < options.joinedFrom) continue;
      if (options?.joinedTo && member.joinedAt > options.joinedTo) continue;

      const existing = entry.patientsMap.get(member.userId);
      if (!existing || member.joinedAt < existing) {
        entry.patientsMap.set(member.userId, member.joinedAt);
      }
    }
  }

  return [...nutriMap.entries()].map(([nutriId, { name, patientsMap }]) => ({
    nutriId,
    nutriName: name,
    patients: [...patientsMap.entries()].map(([userId, joinedAt]) => ({
      userId,
      joinedAt,
    })),
  }));
}

// ─── Public Functions ─────────────────────────────────────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Activation rate per nutritionist.
 * "Activated" = patient logged at least once within 7 days of their joinedAt.
 * `range` scopes which patients to include (by joinedAt).
 */
export async function getActivationRateByNutritionist(
  range?: Partial<DateRange>,
): Promise<NutriActivationRow[]> {
  const { from, to } = resolveDateRange(range);

  const entries = await fetchNutriPatientMappings({
    joinedFrom: new Date(from),
    joinedTo: new Date(to),
  });

  const allPatientIds = entries.flatMap((e) => e.patients.map((p) => p.userId));

  if (allPatientIds.length === 0) {
    return entries.map((e) => ({
      nutriId: e.nutriId,
      nutriName: e.nutriName,
      invited: 0,
      activated: 0,
      activationRatePct: 0,
    }));
  }

  const logs = await prisma.dailyLog.findMany({
    where: { userId: { in: allPatientIds } },
    select: { userId: true, eventTime: true },
  });

  // Map: userId → earliest log eventTime
  const earliestLogTime = new Map<string, number>();
  for (const log of logs) {
    const t = new Date(log.eventTime).getTime();
    const existing = earliestLogTime.get(log.userId);
    if (existing === undefined || t < existing) {
      earliestLogTime.set(log.userId, t);
    }
  }

  return entries.map((entry) => {
    const invited = entry.patients.length;
    const activated = entry.patients.filter((p) => {
      const firstLogTs = earliestLogTime.get(p.userId);
      if (firstLogTs === undefined) return false;
      return firstLogTs - p.joinedAt.getTime() <= SEVEN_DAYS_MS;
    }).length;

    return {
      nutriId: entry.nutriId,
      nutriName: entry.nutriName,
      invited,
      activated,
      activationRatePct:
        invited === 0 ? 0 : Math.round((activated / invited) * 100),
    };
  });
}

/**
 * Patient retention per nutritionist.
 * "Retained" = patient logged at least once in the last `days` days.
 */
export async function getPatientRetentionByNutritionist(
  days = 30,
): Promise<NutriRetentionRow[]> {
  const entries = await fetchNutriPatientMappings();

  const allPatientIds = entries.flatMap((e) => e.patients.map((p) => p.userId));

  if (allPatientIds.length === 0) {
    return entries.map((e) => ({
      nutriId: e.nutriId,
      nutriName: e.nutriName,
      totalPatients: 0,
      retainedPatients: 0,
      retentionPct: 0,
    }));
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const recentLogs = await prisma.dailyLog.findMany({
    where: {
      userId: { in: allPatientIds },
      eventTime: { gte: since },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  const activePatientIds = new Set(recentLogs.map((l) => l.userId));

  return entries.map((entry) => {
    const totalPatients = entry.patients.length;
    const retainedPatients = entry.patients.filter((p) =>
      activePatientIds.has(p.userId),
    ).length;

    return {
      nutriId: entry.nutriId,
      nutriName: entry.nutriName,
      totalPatients,
      retainedPatients,
      retentionPct:
        totalPatients === 0
          ? 0
          : Math.round((retainedPatients / totalPatients) * 100),
    };
  });
}

/**
 * Plan distribution snapshot for nutritionists.
 *
 * Note: upgrade history is NOT tracked in SystemEvent — this is a current
 * snapshot only. To track plan transitions, emit a PLAN_UPGRADED event in
 * SystemEvent when a user's plan changes.
 *
 * The `range` parameter is accepted for API consistency but does not filter
 * the snapshot (plan changes aren't recorded).
 */
export async function getPlanDistributionAndUpgrades(): Promise<PlanDistributionResult> {
  const nutriAdmins = await prisma.teamMember.findMany({
    where: { role: 'ADMIN' },
    distinct: ['userId'],
    select: { userId: true },
  });

  if (nutriAdmins.length === 0) {
    return { distribution: [], upgradeHistoryAvailable: false };
  }

  const ids = nutriAdmins.map((m) => m.userId);

  const groups = await prisma.user.groupBy({
    by: ['plan'],
    where: { id: { in: ids } },
    _count: { plan: true },
  });

  const distribution: PlanDistributionItem[] = groups.map((g) => ({
    plan: g.plan,
    count: g._count.plan,
  }));

  return { distribution, upgradeHistoryAvailable: false };
}

/**
 * Ranking of nutritionists by average patient engagement (logs per patient,
 * last 30 days). Sorted descending — index 0 is the best performer.
 */
export async function getNutritionistEngagementRanking(): Promise<
  NutriEngagementRow[]
> {
  const entries = await fetchNutriPatientMappings();

  const allPatientIds = entries.flatMap((e) => e.patients.map((p) => p.userId));

  const logCountMap = new Map<string, number>();

  if (allPatientIds.length > 0) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const groups = await prisma.dailyLog.groupBy({
      by: ['userId'],
      where: {
        userId: { in: allPatientIds },
        eventTime: { gte: since },
      },
      _count: { userId: true },
    });

    for (const g of groups) {
      logCountMap.set(g.userId, g._count.userId);
    }
  }

  const rows: NutriEngagementRow[] = entries.map((entry) => {
    const totalPatients = entry.patients.length;

    if (totalPatients === 0) {
      return {
        nutriId: entry.nutriId,
        nutriName: entry.nutriName,
        totalPatients: 0,
        avgLogsPerPatient: 0,
      };
    }

    const totalLogs = entry.patients.reduce(
      (sum, p) => sum + (logCountMap.get(p.userId) ?? 0),
      0,
    );

    return {
      nutriId: entry.nutriId,
      nutriName: entry.nutriName,
      totalPatients,
      avgLogsPerPatient: parseFloat((totalLogs / totalPatients).toFixed(1)),
    };
  });

  return rows.sort((a, b) => b.avgLogsPerPatient - a.avgLogsPerPatient);
}
