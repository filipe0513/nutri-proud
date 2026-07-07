import { prisma } from '@/lib/prisma';
import { DailyLog } from '@prisma/client';
import { getLocalDayInterval } from './logService';
import {
  calculateWaterScore,
  calculateFoodScore,
  calculateSleepScore,
  calculateTrainingScore,
  calculateGutScore,
} from '@/utils/scoreUtils';

const CATEGORY_EMOJI: Record<string, string> = {
  water: '💧',
  food: '🍎',
  sleep: '💤',
  workout: '💪',
  poop: '💩',
  note: '📝',
  jacada: '🍔',
};

const CATEGORY_LABEL: Record<string, string> = {
  water: 'Água',
  food: 'Alimentação',
  sleep: 'Sono',
  workout: 'Treino',
  poop: 'Intestino',
  note: 'Anotação',
  jacada: 'Jacada',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

interface ReportResult {
  text: string;
  periodLabel: string;
  totalLogs: number;
  averageScore: number;
}

// ---------------------------------------------------------------------------
// 🍔 Jacada helpers
// ---------------------------------------------------------------------------

const JACADA_LEVELS: { max: number; label: string; emoji: string }[] = [
  { max: 3,        label: 'um pouquinho',    emoji: '😅' },
  { max: 6,        label: 'mais ou menos',   emoji: '😬' },
  { max: 9,        label: 'muito',           emoji: '😰' },
  { max: 12,       label: 'exagerei',        emoji: '😱' },
  { max: Infinity, label: 'chutei o balde',  emoji: '🤦' },
];

function getJacadaIntensity(
  sugar: number,
  fat: number,
  alcohol: number
): { label: string; emoji: string; sum: number } {
  const sum = sugar + fat + alcohol;
  const level = JACADA_LEVELS.find((l) => sum <= l.max) ?? JACADA_LEVELS[JACADA_LEVELS.length - 1];
  return { label: level.label, emoji: level.emoji, sum };
}

/**
 * Penalty deducted from a day's average score for each jacada.
 * Max penalty: 30 pts/day. A "chutei o balde" (sum=15) → 30 pts.
 */
function calcJacadaDayPenalty(dayJacadaLogs: DailyLog[]): number {
  if (dayJacadaLogs.length === 0) return 0;
  const totalSum = dayJacadaLogs.reduce((acc, l) => {
    const d = l.details as Record<string, number>;
    return acc + (d.sugar ?? 0) + (d.fat ?? 0) + (d.alcohol ?? 0);
  }, 0);
  return Math.min(30, Math.round((totalSum / 15) * 30));
}

/** Builds the jacada text section lines. Returns [] when no jacadas exist. */
function buildJacadaSection(
  logs: DailyLog[],
  byDay: Map<string, DailyLog[]>
): string[] {
  const jacadaLogs = logs.filter((l) => l.category === 'jacada');
  if (jacadaLogs.length === 0) return [];

  const lines: string[] = [];
  lines.push('🍔 *Jacadas (Deslizes)*');
  lines.push(`Total: ${jacadaLogs.length} deslize${jacadaLogs.length > 1 ? 's' : ''} no período`);

  // Find most intense jacada
  let worstLog: DailyLog | null = null;
  let worstSum = -1;
  for (const log of jacadaLogs) {
    const d = log.details as Record<string, number>;
    const s = (d.sugar ?? 0) + (d.fat ?? 0) + (d.alcohol ?? 0);
    if (s > worstSum) { worstSum = s; worstLog = log; }
  }
  if (worstLog) {
    const d = worstLog.details as Record<string, number>;
    const { label, emoji } = getJacadaIntensity(d.sugar ?? 0, d.fat ?? 0, d.alcohol ?? 0);
    lines.push(`• Maior escorregão: ${formatDate(worstLog.eventTime)} — "${label}" ${emoji}`);
  }

  // High-alcohol highlight
  const alcoholHigh = jacadaLogs.filter((l) => ((l.details as Record<string, number>).alcohol ?? 0) >= 4);
  if (alcoholHigh.length > 0) {
    lines.push(`• Álcool acima do limite: ${alcoholHigh.length} vez${alcoholHigh.length > 1 ? 'es' : ''}`);
  }

  // Triple-combo highlight
  const tripleCombo = jacadaLogs.filter((l) => {
    const d = l.details as Record<string, number>;
    return (d.sugar ?? 0) >= 4 && (d.fat ?? 0) >= 4 && (d.alcohol ?? 0) >= 4;
  });
  if (tripleCombo.length > 0) {
    lines.push(`• Combo completo (açúcar + gordura + álcool): ${tripleCombo.length} vez${tripleCombo.length > 1 ? 'es' : ''}`);
  }

  // Busiest day (multiple jacadas in one day)
  if (jacadaLogs.length > 1) {
    const perDayCount = new Map<string, number>();
    for (const [dayKey, dayLogs] of byDay.entries()) {
      const count = dayLogs.filter((l) => l.category === 'jacada').length;
      if (count > 0) perDayCount.set(dayKey, count);
    }
    const busiest = [...perDayCount.entries()].sort((a, b) => b[1] - a[1])[0];
    if (busiest && busiest[1] > 1) {
      lines.push(`• Dia com mais deslizes: ${formatDate(new Date(`${busiest[0]}T12:00:00.000Z`))} (${busiest[1]}x)`);
    }
  }

  return lines;
}

// ---------------------------------------------------------------------------
// 💪 Workout — Hybrid period score (frequency × quality)
// ---------------------------------------------------------------------------

/**
 * Hybrid workout score for multi-day periods.
 *   frequency_score = min(100, (unique_sessions / proportional_goal) × 100)
 *   quality_score   = average cardio+carga score across sessions
 *   hybrid          = frequency_score × 0.6 + quality_score × 0.4
 */
function calcWorkoutPeriodScore(
  workoutLogs: DailyLog[],
  startDate: string,
  endDate: string,
  weeklyTarget = 3
): number {
  const uniqueSessions = new Set(
    workoutLogs.map((l) =>
      l.eventTime
        .toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .split('/')
        .reverse()
        .join('-')
    )
  ).size;

  const start = new Date(`${startDate}T12:00:00.000Z`);
  const end   = new Date(`${endDate}T12:00:00.000Z`);
  const days  = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const weeks = days / 7;
  const proportionalGoal = Math.max(1, weeks * weeklyTarget);

  const frequencyScore = Math.min(100, Math.round((uniqueSessions / proportionalGoal) * 100));

  const qualityScores = workoutLogs.map((l) => {
    const d = l.details as Record<string, unknown>;
    const factors = (d?.factors ?? {}) as Record<string, number>;
    return calculateTrainingScore(factors.cardio ?? 0, factors.carga ?? 0);
  });
  const qualityScore =
    qualityScores.length > 0
      ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      : 0;

  return Math.round(frequencyScore * 0.6 + qualityScore * 0.4);
}

// ---------------------------------------------------------------------------
// 🎯 Consistency Index (NPS-like)
// ---------------------------------------------------------------------------

/**
 * Index = % Excellent days (≥ 80) − % Critical days (< 60), scaled to −100 … +100.
 */
function calcConsistencyIndex(dayScores: number[]): {
  index: number;
  label: string;
  emoji: string;
  excellentDays: number;
  criticalDays: number;
  totalDays: number;
} {
  const totalDays    = dayScores.length;
  const excellentDays = dayScores.filter((s) => s >= 80).length;
  const criticalDays  = dayScores.filter((s) => s < 60).length;
  const index = Math.round(((excellentDays - criticalDays) / totalDays) * 100);

  let label: string;
  let emoji: string;
  if (index >= 75)      { label = 'Consistência Excelente'; emoji = '🔥'; }
  else if (index >= 50) { label = 'No Caminho Certo';       emoji = '💪'; }
  else if (index >= 25) { label = 'Com Altos e Baixos';     emoji = '📊'; }
  else if (index >= 0)  { label = 'Precisa de Atenção';     emoji = '⚠️'; }
  else                  { label = 'Alerta Nutricional';     emoji = '🆘'; }

  return { index, label, emoji, excellentDays, criticalDays, totalDays };
}

// ---------------------------------------------------------------------------
// Per-day pillar scoring (non-workout; workout uses calcWorkoutPeriodScore for multi-day)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcPillarScore(category: string, dayLogs: DailyLog[], userTargets: any): number {
  const catLogs = dayLogs.filter((l) => l.category === category);
  if (catLogs.length === 0) return 0;

  switch (category) {
    case 'water': {
      const totalMl = catLogs.reduce((acc, l) => {
        const d = l.details as Record<string, unknown>;
        return acc + (typeof d?.quantity_ml === 'number' ? d.quantity_ml : 0);
      }, 0);
      return calculateWaterScore(totalMl, userTargets?.water_ml_per_day ?? 2000);
    }

    case 'food': {
      const plannedMeals = userTargets?.planned_meals;
      return calculateFoodScore(
        catLogs.map((l) => ({ category: 'food', primaryValue: l.primaryValue })),
        Array.isArray(plannedMeals) ? plannedMeals : (plannedMeals ?? 3)
      );
    }

    case 'sleep': {
      const log = catLogs[catLogs.length - 1];
      const d = log.details as Record<string, unknown>;
      return calculateSleepScore(
        typeof d?.duration_hours === 'number' ? d.duration_hours : 8,
        typeof d?.awoke_times === 'number' ? d.awoke_times : 0,
        (d?.quality_feeling as 'cansado' | 'normal' | 'revigorado' | null) ?? 'normal',
        userTargets?.sleep_hours_per_night ?? 8
      );
    }

    case 'workout': {
      // Single-day: use cardio+carga quality score only
      const log = catLogs[catLogs.length - 1];
      const d = log.details as Record<string, unknown>;
      const factors = (d?.factors ?? {}) as Record<string, number>;
      return calculateTrainingScore(factors.cardio ?? 0, factors.carga ?? 0);
    }

    case 'poop': {
      const log = catLogs[catLogs.length - 1];
      const d = log.details as Record<string, unknown>;
      return calculateGutScore(typeof d?.state === 'string' ? d.state : 'normal');
    }

    default: {
      const avg = catLogs.reduce((acc, l) => acc + l.primaryValue, 0) / catLogs.length;
      return Math.round(avg);
    }
  }
}

export const reportService = {
  async generateReport(
    userId: string,
    startDate: string,
    endDate: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userTargets?: any
  ): Promise<ReportResult> {
    const start = getLocalDayInterval(startDate).start;
    const end   = getLocalDayInterval(endDate).end;

    const logs: DailyLog[] = await prisma.dailyLog.findMany({
      where: { userId, eventTime: { gte: start, lte: end } },
      orderBy: { eventTime: 'asc' },
    });

    // ---------- Day-grouped map ----------
    const byDay = new Map<string, DailyLog[]>();
    for (const log of logs) {
      const dayKey = log.eventTime
        .toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .split('/')
        .reverse()
        .join('-');
      if (!byDay.has(dayKey)) byDay.set(dayKey, []);
      byDay.get(dayKey)!.push(log);
    }

    const SCORED_CATEGORIES = ['water', 'food', 'sleep', 'workout', 'poop'];
    const isMultiDay = startDate !== endDate;
    const weeklyWorkoutTarget: number = userTargets?.weekly_workouts ?? 3;

    // Pre-compute hybrid workout score for the whole period (multi-day only)
    const allWorkoutLogs = logs.filter((l) => l.category === 'workout');
    const periodWorkoutScore = isMultiDay
      ? calcWorkoutPeriodScore(allWorkoutLogs, startDate, endDate, weeklyWorkoutTarget)
      : null;

    // ---------- Per-day scores (with jacada penalty) ----------
    const allDayScores: number[] = [];
    const greatDays: string[] = [];
    const toughDays: string[] = [];

    for (const [day, dayLogs] of byDay.entries()) {
      const hasScoredLog = dayLogs.some((l) => SCORED_CATEGORIES.includes(l.category));
      if (!hasScoredLog) continue;

      const pillarScores = SCORED_CATEGORIES.map((cat) =>
        calcPillarScore(cat, dayLogs, userTargets)
      );
      const rawAvg = Math.round(pillarScores.reduce((a, b) => a + b, 0) / SCORED_CATEGORIES.length);

      const jacadaPenalty = calcJacadaDayPenalty(dayLogs.filter((l) => l.category === 'jacada'));
      const dayAvg = Math.max(0, rawAvg - jacadaPenalty);

      allDayScores.push(dayAvg);
      const label = formatDate(new Date(`${day}T12:00:00.000Z`));
      if (dayAvg >= 85) greatDays.push(label);
      else if (dayAvg < 40) toughDays.push(label);
    }

    // Exclude jacadas from the raw "total logs" count shown to user
    const totalLogs = logs.filter((l) => l.category !== 'jacada').length;
    const averageScore =
      allDayScores.length > 0
        ? Math.round(allDayScores.reduce((a, b) => a + b, 0) / allDayScores.length)
        : 0;

    // ---------- Category breakdown ----------
    const catLines: string[] = [];
    for (const cat of SCORED_CATEGORIES) {
      if (cat === 'workout' && isMultiDay && periodWorkoutScore !== null) {
        const uniqueSessions = new Set(
          allWorkoutLogs.map((l) =>
            l.eventTime
              .toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })
              .split('/').reverse().join('-')
          )
        ).size;
        const days  = Math.max(1, Math.round((new Date(`${endDate}T12:00:00.000Z`).getTime() - new Date(`${startDate}T12:00:00.000Z`).getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const goal  = Math.round((days / 7) * weeklyWorkoutTarget);
        catLines.push(`${CATEGORY_EMOJI.workout} ${CATEGORY_LABEL.workout}: ${periodWorkoutScore}/100 (${uniqueSessions}/${Math.max(goal, 1)} sessões)`);
        continue;
      }

      const dayScores: number[] = [];
      for (const [, dayLogs] of byDay.entries()) {
        if (!dayLogs.some((l) => l.category === cat)) continue;
        dayScores.push(calcPillarScore(cat, dayLogs, userTargets));
      }
      if (dayScores.length === 0) continue;
      const avg = Math.round(dayScores.reduce((a, b) => a + b, 0) / dayScores.length);
      catLines.push(`${CATEGORY_EMOJI[cat] ?? '📊'} ${CATEGORY_LABEL[cat] ?? cat}: ${avg}/100`);
    }

    // ---------- Best / worst pillar ----------
    const pillarAvgs: { cat: string; avg: number }[] = [];
    for (const cat of SCORED_CATEGORIES) {
      if (cat === 'workout' && isMultiDay && periodWorkoutScore !== null) {
        pillarAvgs.push({ cat, avg: periodWorkoutScore });
        continue;
      }
      const scores: number[] = [];
      for (const [, dayLogs] of byDay.entries()) {
        if (!dayLogs.some((l) => l.category === cat)) continue;
        scores.push(calcPillarScore(cat, dayLogs, userTargets));
      }
      if (scores.length > 0) pillarAvgs.push({ cat, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) });
    }
    const bestPillar  = pillarAvgs.length > 0 ? pillarAvgs.reduce((a, b) => (a.avg >= b.avg ? a : b)) : null;
    const worstPillar = pillarAvgs.length > 0 ? pillarAvgs.reduce((a, b) => (a.avg <= b.avg ? a : b)) : null;

    // ---------- Consistency index (multi-day only) ----------
    const consistency = isMultiDay && allDayScores.length > 1
      ? calcConsistencyIndex(allDayScores)
      : null;

    // ---------- Jacada section ----------
    const jacadaLines = buildJacadaSection(logs, byDay);

    // ---------- Observations from notes ----------
    const observations: string[] = [];
    for (const log of logs) {
      const details = log.details as Record<string, unknown>;
      const note = (details?.notes as string) || (details?.note as string);
      if (note && note.trim()) {
        observations.push(`Dia ${formatDate(log.eventTime)}: "${note.trim()}"`);
      }
    }

    // ---------- Period label ----------
    const startFmt = formatDate(new Date(`${startDate}T12:00:00.000Z`));
    const endFmt   = formatDate(new Date(`${endDate}T12:00:00.000Z`));
    const periodLabel = startDate === endDate ? startFmt : `${startFmt} → ${endFmt}`;

    // ---------- Build text ----------
    const lines: string[] = [];
    lines.push('🌟 *Relatório de Saúde — Orgulho da Nutri* 🌟');
    lines.push(`📅 Período: ${periodLabel}`);
    lines.push('');

    if (totalLogs === 0) {
      lines.push('Nenhum registro encontrado para esse período.');
    } else {
      // Consistency index (multi-day)
      if (consistency) {
        const sign = consistency.index >= 0 ? '+' : '';
        lines.push(`🎯 *Índice de Consistência: ${sign}${consistency.index} — "${consistency.label}" ${consistency.emoji}*`);
        lines.push(`(Dias excelentes: ${consistency.excellentDays} | Dias críticos: ${consistency.criticalDays} | de ${consistency.totalDays} dias)`);
        lines.push('');
      }

      lines.push(`📊 *Resumo Geral*`);
      lines.push(`Total de registros: ${totalLogs} | Média de pontuação: ${averageScore}/100`);
      lines.push('');

      if (catLines.length > 0) {
        lines.push('📋 *Pilares de Saúde*');
        lines.push(...catLines);
        lines.push('');
      }

      if (bestPillar && worstPillar && bestPillar.cat !== worstPillar.cat) {
        lines.push('🏆 *Destaques dos Pilares*');
        lines.push(`🥇 Melhor: ${CATEGORY_EMOJI[bestPillar.cat]} ${CATEGORY_LABEL[bestPillar.cat]} (${bestPillar.avg}/100)`);
        lines.push(`📉 A melhorar: ${CATEGORY_EMOJI[worstPillar.cat]} ${CATEGORY_LABEL[worstPillar.cat]} (${worstPillar.avg}/100)`);
        lines.push('');
      }

      if (greatDays.length > 0) {
        lines.push(`✅ *Dias em Destaque (≥ 85 pts)*`);
        lines.push(greatDays.join(', '));
        lines.push('');
      }

      if (toughDays.length > 0) {
        lines.push(`⚠️ *Dias Difíceis (< 40 pts)*`);
        lines.push(toughDays.join(', '));
        lines.push('');
      }

      if (jacadaLines.length > 0) {
        lines.push(...jacadaLines);
        lines.push('');
      }

      if (observations.length > 0) {
        lines.push(`📝 *Observações Registradas*`);
        lines.push(...observations);
        lines.push('');
      }
    }

    const appUrl = process.env.NEXTAUTH_URL || 'https://nutri-proud.vercel.app';
    lines.push('---');
    lines.push(`Acompanhe minha evolução diária! Baixe o Orgulho da Nutri em: ${appUrl}`);

    return { text: lines.join('\n'), periodLabel, totalLogs, averageScore };
  },
};
