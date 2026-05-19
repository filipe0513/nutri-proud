import { prisma } from '@/lib/prisma';
import { DailyLog } from '@prisma/client';

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

export const reportService = {
  async generateReport(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ReportResult> {
    // Expand endDate to include the full day
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

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

    // ---------- Calculations ----------

    const scoredLogs = logs.filter((l) => l.category !== 'note');
    const totalLogs = logs.length;

    const averageScore =
      scoredLogs.length > 0
        ? Math.round(
            scoredLogs.reduce((acc, l) => acc + l.primaryValue, 0) /
              scoredLogs.length
          )
        : 0;

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

    // Great days (score ≥ 85) and tough days (score < 40)
    const greatDays: string[] = [];
    const toughDays: string[] = [];

    for (const [day, dayLogs] of byDay.entries()) {
      const scored = dayLogs.filter((l) => l.category !== 'note');
      if (scored.length === 0) continue;
      const avg =
        scored.reduce((acc, l) => acc + l.primaryValue, 0) / scored.length;
      const label = formatDate(new Date(`${day}T12:00:00.000Z`));
      if (avg >= 85) greatDays.push(label);
      else if (avg < 40) toughDays.push(label);
    }

    // Observations from notes + food/sleep notes
    const observations: string[] = [];
    for (const log of logs) {
      const details = log.details as Record<string, unknown>;
      const note = (details?.notes as string) || (details?.note as string);
      if (note && note.trim()) {
        const label = formatDate(log.eventTime);
        observations.push(`Dia ${label}: "${note.trim()}"`);
      }
    }

    // ---------- Category breakdown ----------
    const categories = ['water', 'food', 'sleep', 'workout', 'poop'];
    const catLines: string[] = [];
    for (const cat of categories) {
      const catLogs = scoredLogs.filter((l) => l.category === cat);
      if (catLogs.length === 0) continue;
      const avg = Math.round(
        catLogs.reduce((acc, l) => acc + l.primaryValue, 0) / catLogs.length
      );
      const emoji = CATEGORY_EMOJI[cat] ?? '📊';
      const label = CATEGORY_LABEL[cat] ?? cat;
      catLines.push(`${emoji} ${label}: ${avg}/100`);
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

    lines.push('---');
    lines.push('Gerado pelo app Orgulho da Nutri 💚');

    return {
      text: lines.join('\n'),
      periodLabel,
      totalLogs,
      averageScore,
    };
  },
};
