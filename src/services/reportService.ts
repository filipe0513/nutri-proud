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
};

const CATEGORY_LABEL: Record<string, string> = {
  water: 'Água',
  food: 'Alimentação',
  sleep: 'Sono',
  workout: 'Treino',
  poop: 'Intestino',
  note: 'Anotação',
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

/**
 * Calculates a realistic pillar score for a day's worth of logs.
 *
 * Water and food must be AGGREGATED first (sum all ml / sum all meal scores)
 * before a score is derived. Other categories use the average of their
 * individual primaryValue fields, which are already properly scaled.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcPillarScore(category: string, dayLogs: DailyLog[], userTargets: any): number {
  const catLogs = dayLogs.filter((l) => l.category === category);
  if (catLogs.length === 0) return 0;

  switch (category) {
    case 'water': {
      // Aggregate total ml across ALL water logs of the day, then score once
      const totalMl = catLogs.reduce((acc, l) => {
        const d = l.details as Record<string, unknown>;
        return acc + (typeof d?.quantity_ml === 'number' ? d.quantity_ml : 0);
      }, 0);
      const target: number = userTargets?.water_ml_per_day ?? 2000;
      return calculateWaterScore(totalMl, target);
    }

    case 'food': {
      // Sum all meal primaryValues against total planned meals target
      const plannedMeals = userTargets?.planned_meals;
      return calculateFoodScore(
        catLogs.map((l) => ({ category: 'food', primaryValue: l.primaryValue })),
        Array.isArray(plannedMeals) ? plannedMeals : (plannedMeals ?? 3)
      );
    }

    case 'sleep': {
      // Use the last sleep log of the day (most recent record wins)
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
      // Use the last workout log of the day
      const log = catLogs[catLogs.length - 1];
      const d = log.details as Record<string, unknown>;
      const factors = (d?.factors ?? {}) as Record<string, number>;
      return calculateTrainingScore(factors.cardio ?? 0, factors.carga ?? 0);
    }

    case 'poop': {
      // Use the last poop log of the day
      const log = catLogs[catLogs.length - 1];
      const d = log.details as Record<string, unknown>;
      return calculateGutScore(typeof d?.state === 'string' ? d.state : 'normal');
    }

    default: {
      // Generic: average primaryValue
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
    // Expand endDate to include the full day
    const start = getLocalDayInterval(startDate).start;
    const end = getLocalDayInterval(endDate).end;

    const logs: DailyLog[] = await prisma.dailyLog.findMany({
      where: {
        userId,
        eventTime: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { eventTime: 'asc' },
    });

    // ---------- Build day-grouped map ----------
    // Group by date (YYYY-MM-DD in São Paulo timezone)
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
        .join('-'); // YYYY-MM-DD
      if (!byDay.has(dayKey)) byDay.set(dayKey, []);
      byDay.get(dayKey)!.push(log);
    }

    // ---------- Per-day pillar scores for the summary ----------
    const SCORED_CATEGORIES = ['water', 'food', 'sleep', 'workout', 'poop'];

    // Compute a representative daily score using proper pillar aggregation
    const allDayScores: number[] = [];
    const greatDays: string[] = [];
    const toughDays: string[] = [];

    for (const [day, dayLogs] of byDay.entries()) {
      const pillarScores = SCORED_CATEGORIES.map((cat) =>
        calcPillarScore(cat, dayLogs, userTargets)
      );
      // Only count days that have at least one scored log
      const hasScoredLog = dayLogs.some((l) => SCORED_CATEGORIES.includes(l.category));
      if (!hasScoredLog) continue;

      const dayAvg = Math.round(
        pillarScores.reduce((a, b) => a + b, 0) / SCORED_CATEGORIES.length
      );
      allDayScores.push(dayAvg);

      const label = formatDate(new Date(`${day}T12:00:00.000Z`));
      if (dayAvg >= 85) greatDays.push(label);
      else if (dayAvg < 40) toughDays.push(label);
    }

    const totalLogs = logs.length;
    const averageScore =
      allDayScores.length > 0
        ? Math.round(allDayScores.reduce((a, b) => a + b, 0) / allDayScores.length)
        : 0;

    // ---------- Category breakdown (aggregated across all days) ----------
    const catLines: string[] = [];
    for (const cat of SCORED_CATEGORIES) {
      const dayScores: number[] = [];
      for (const [, dayLogs] of byDay.entries()) {
        const score = calcPillarScore(cat, dayLogs, userTargets);
        const hasCatLog = dayLogs.some((l) => l.category === cat);
        if (hasCatLog) dayScores.push(score);
      }
      if (dayScores.length === 0) continue;
      const avg = Math.round(dayScores.reduce((a, b) => a + b, 0) / dayScores.length);
      const emoji = CATEGORY_EMOJI[cat] ?? '📊';
      const label = CATEGORY_LABEL[cat] ?? cat;
      catLines.push(`${emoji} ${label}: ${avg}/100`);
    }

    // ---------- Observations from notes ----------
    const observations: string[] = [];
    for (const log of logs) {
      const details = log.details as Record<string, unknown>;
      const note = (details?.notes as string) || (details?.note as string);
      if (note && note.trim()) {
        const label = formatDate(log.eventTime);
        observations.push(`Dia ${label}: "${note.trim()}"`);
      }
    }

    // ---------- Period label ----------
    const startFmt = formatDate(new Date(`${startDate}T12:00:00.000Z`));
    const endFmt = formatDate(new Date(`${endDate}T12:00:00.000Z`));
    const periodLabel =
      startDate === endDate ? startFmt : `${startFmt} → ${endFmt}`;

    // ---------- Build text ----------
    const lines: string[] = [];

    lines.push('🌟 *Relatório de Saúde — Orgulho da Nutri* 🌟');
    lines.push(`📅 Período: ${periodLabel}`);
    lines.push('');

    if (totalLogs === 0) {
      lines.push('Nenhum registro encontrado para esse período.');
    } else {
      lines.push(`📊 *Resumo Geral*`);
      lines.push(
        `Total de registros: ${totalLogs} | Média de pontuação: ${averageScore}/100`
      );
      lines.push('');

      if (catLines.length > 0) {
        lines.push('📋 *Pilares de Saúde*');
        lines.push(...catLines);
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

      if (observations.length > 0) {
        lines.push(`📝 *Observações Registradas*`);
        lines.push(...observations);
        lines.push('');
      }
    }

    const appUrl = process.env.NEXTAUTH_URL || 'https://nutri-proud.vercel.app';
    lines.push('---');
    lines.push(
      `Acompanhe minha evolução diária! Baixe o Orgulho da Nutri em: ${appUrl}`
    );

    return {
      text: lines.join('\n'),
      periodLabel,
      totalLogs,
      averageScore,
    };
  },
};
