import { prisma } from '../lib/prisma';
import { aiService } from './aiService';
import { DailyLog } from '@prisma/client';
import { AiInsightResponse } from '@/schemas/insightSchema';
import { getLocalStartOfDay } from '@/utils/dateUtils';
import { createInsightNotification } from './notificationService';

export const insightService = {
  /**
   * Insight semanal — usado na rota GET /api/insights existente.
   * Mantido para retrocompatibilidade.
   */
  async getWeeklyInsights(userId: string, generate: boolean = false) {
    const today = getLocalStartOfDay();

    // 1. Check Rate Limit (1 insight por dia)
    const existingInsight = await prisma.aiInsight.findFirst({
      where: {
        userId,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    const logsThisWeek = await prisma.dailyLog.findMany({
      where: { userId, eventTime: { gte: sevenDaysAgo } },
    });

    const logsLastWeek = await prisma.dailyLog.findMany({
      where: { userId, eventTime: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
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
        ? Math.round(
            logsThisWeek.reduce((acc: number, log: DailyLog) => acc + log.primaryValue, 0) /
              logsThisWeek.length
          )
        : 0;

    const globalAvgLastWeek =
      logsLastWeek.length > 0
        ? Math.round(
            logsLastWeek.reduce((acc: number, log: DailyLog) => acc + log.primaryValue, 0) /
              logsLastWeek.length
          )
        : 0;

    let strongestPillar: string | null = null;
    let weakestPillar: string | null = null;

    const entries = Object.entries(averagesThisWeek);
    if (entries.length > 0) {
      entries.sort((a, b) => b[1] - a[1]);
      strongestPillar = entries[0][0];
      weakestPillar = entries[entries.length - 1][0];
    }

    let aiText = existingInsight?.message || null;

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
        data: { userId, message: aiText, cta: weakestPillar },
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Novo sistema de Insights contextuais (Task #64)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Gera e persiste um novo insight contextual baseado na hora local do usuário
   * e nos logs do dia, usando a IA com saída JSON forçada.
   */
  async generateContextualInsight(userId: string, localTime: string) {
    // ── Rate limit: máximo 1 insight por hora por usuário ────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentInsight = await prisma.aiInsight.findFirst({
      where: { userId, createdAt: { gte: oneHourAgo } },
      orderBy: { createdAt: 'desc' },
    });
    if (recentInsight) {
      // Retorna o existente sem chamar a IA
      return recentInsight;
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Pega logs do dia atual no fuso de São Paulo
    const dayStart = getLocalStartOfDay();

    const todayLogs = await prisma.dailyLog.findMany({
      where: { userId, eventTime: { gte: dayStart } },
    });

    const ALL_CATEGORIES = ['WATER', 'FOOD', 'SLEEP', 'WORKOUT', 'POOP'];
    const registeredCategories = [...new Set(todayLogs.map((l) => l.category.toUpperCase()))];
    const missingCategories = ALL_CATEGORIES.filter((c) => !registeredCategories.includes(c));

    // Extrai a hora diretamente da string ISO (ex: "2026-06-19T23:53:00.000-03:00")
    // sem usar new Date().getHours(), que no Node.js ignora o offset e retorna UTC.
    // O formato é garantido por toLocalISOString() + validação Zod (offset: true).
    const hour = parseInt(localTime.slice(11, 13), 10);
    const periodLabel =
      hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';

    const logsSummary =
      todayLogs.length === 0
        ? 'Nenhum registro feito hoje ainda.'
        : todayLogs
            .map((l) => `- ${l.category}: score ${l.primaryValue}/100`)
            .join('\n');

    const prompt = `
Você é a Nutri, assistente de saúde acolhedora e bem-humorada do app "Orgulho da Nutri".
É ${periodLabel} (${hour}h) para o usuário.
Logs de hoje:
${logsSummary}
Pilares ainda não registrados hoje: ${missingCategories.join(', ') || 'nenhum (parabéns!)'}

Gere UMA mensagem curta (máx 2 frases), empática e motivadora cruzando a hora do dia com os hábitos faltantes.
Use emojis com moderação. Seja direta, nunca punitiva.

Responda SOMENTE com um JSON válido neste formato exato (sem markdown, sem explicações):
{"message": "<texto da mensagem>", "cta": "<NOME_DO_HABITO_EM_MAIUSCULO_OU_null>"}

Se não houver hábito prioritário para sugerir, use null em cta.
`.trim();

    const rawText = await aiService.generateRawText(prompt);

    // Tenta fazer parse do JSON retornado
    let parsed: AiInsightResponse;
    try {
      // Remove possíveis blocos de código markdown que a IA às vezes adiciona
      const clean = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean) as AiInsightResponse;
    } catch {
      // Fallback: se a IA não retornou JSON válido, usa o texto bruto como message
      parsed = { message: rawText.slice(0, 300), cta: null };
    }

    const insight = await prisma.aiInsight.create({
      data: {
        userId,
        message: parsed.message,
        cta: parsed.cta ?? null,
        isViewed: false,
      },
    });

    // Espelha o insight como notificação persistente (fire-and-forget)
    createInsightNotification(userId, parsed.message, parsed.cta ?? null).catch(() => {/* silent */});

    return insight;
  },

  /**
   * Retorna o insight mais recente do usuário.
   */
  async getLatestInsight(userId: string) {
    return prisma.aiInsight.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Marca um insight como lido (is_viewed = true).
   */
  async markAsViewed(insightId: string, userId: string) {
    // Garante que o insight pertence ao usuário antes de atualizar
    const insight = await prisma.aiInsight.findFirst({
      where: { id: insightId, userId },
    });

    if (!insight) return null;

    return prisma.aiInsight.update({
      where: { id: insightId },
      data: { isViewed: true },
    });
  },
};
