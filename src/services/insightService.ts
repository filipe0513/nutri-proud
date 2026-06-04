import { prisma } from '../lib/prisma';
import { aiService } from './aiService';
import { DailyLog } from '@prisma/client';

export const insightService = {
  async getWeeklyInsights(userId: string, generate: boolean = false) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check Rate Limit (1 insight per day)
    const existingInsight = await prisma.aiInsight.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    const logsThisWeek = await prisma.dailyLog.findMany({
      where: {
        userId,
        eventTime: { gte: sevenDaysAgo },
      },
    });

    const logsLastWeek = await prisma.dailyLog.findMany({
      where: {
        userId,
        eventTime: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    });

    const calculateAverages = (logs: DailyLog[]) => {
      const categoryTotals: Record<string, { sum: number; count: number }> = {};
      logs.forEach((log) => {
        if (!categoryTotals[log.category]) {
          categoryTotals[log.category] = { sum: 0, count: 0 };
        }
        categoryTotals[log.category].sum += log.primaryValue;
        categoryTotals[log.category].count += 1;
      });

      const averages: Record<string, number> = {};
      for (const [cat, data] of Object.entries(categoryTotals)) {
        averages[cat] = Math.round(data.sum / data.count);
      }
      return averages;
    };

    const averagesThisWeek = calculateAverages(logsThisWeek);

    const globalAvgThisWeek =
      logsThisWeek.length > 0
        ? Math.round(logsThisWeek.reduce((acc: number, log: DailyLog) => acc + log.primaryValue, 0) / logsThisWeek.length)
        : 0;

    const globalAvgLastWeek =
      logsLastWeek.length > 0
        ? Math.round(logsLastWeek.reduce((acc: number, log: DailyLog) => acc + log.primaryValue, 0) / logsLastWeek.length)
        : 0;

    let strongestPillar: string | null = null;
    let weakestPillar: string | null = null;

    const entries = Object.entries(averagesThisWeek);
    if (entries.length > 0) {
      entries.sort((a, b) => b[1] - a[1]);
      strongestPillar = entries[0][0]; // highest score
      weakestPillar = entries[entries.length - 1][0]; // lowest score
    }

    let aiText = existingInsight?.content || null;

    // Generate new insight if not found for today and generate flag is true
    if (!aiText && generate) {
      const logsSummary = `
        Média Geral da Semana: ${globalAvgThisWeek}/100
        Média da Semana Passada: ${globalAvgLastWeek}/100
        Pilar Mais Forte: ${strongestPillar || 'N/A'}
        Pilar Mais Fraco: ${weakestPillar || 'N/A'}
        Total de Registros Esta Semana: ${logsThisWeek.length}
        Detalhes por Categoria (Média):
        ${Object.entries(averagesThisWeek)
          .map(([cat, avg]) => `- ${cat}: ${avg}/100`)
          .join('\n')}
      `;

      const prompt = `Você é a assistente virtual da Nutri Proud. Analise os logs desta semana do usuário. Escreva um parágrafo curto, acolhedor e usando emojis. Destaque um ponto positivo e dê uma dica de melhoria. Não seja punitiva. Não use formatação markdown complexa.`;

      aiText = await aiService.generateInsightFromLogs(prompt, logsSummary);

      await prisma.aiInsight.create({
        data: {
          userId,
          content: aiText,
        },
      });
    }

    return {
      aiVerdict: aiText,
      metrics: {
        weeklyAverage: globalAvgThisWeek,
        previousWeeklyAverage: globalAvgLastWeek,
        strongestPillar,
        weakestPillar,
      },
    };
  },
};
