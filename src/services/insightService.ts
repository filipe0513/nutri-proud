import { prisma } from '../lib/prisma';
import { aiService } from './aiService';
import { DailyLog } from '@prisma/client';
import { AiInsightResponse } from '@/schemas/insightSchema';
import { getLocalStartOfDay } from '@/utils/dateUtils';
import { createInsightNotification } from './notificationService';
import { getWeeklyProgress } from './progressService';

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
      return recentInsight;
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── 1. Perfil do usuário (targets + profile) ──────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targets: true, profile: true },
    });

    type UserTargets = {
      water_ml_per_day?: number;
      sleep_hours_per_night?: number;
      workouts_per_week?: number;
      meals_per_day?: number;
    };
    type UserProfile = {
      main_goal?: string;
    };

    const targets = (user?.targets ?? {}) as UserTargets;
    const profile = (user?.profile ?? {}) as UserProfile;

    const waterGoalMl = targets.water_ml_per_day ?? 2500;
    const sleepGoalHours = targets.sleep_hours_per_night ?? 8;
    const workoutGoalPerWeek = targets.workouts_per_week ?? 3;
    const mealsGoalPerDay = targets.meals_per_day ?? 3;
    const mainGoal = profile.main_goal ?? 'health';

    // ── 2. Últimos 30 logs (histórico recente) ────────────────────────────────
    const last30Logs = await prisma.dailyLog.findMany({
      where: { userId },
      orderBy: { eventTime: 'desc' },
      take: 30,
    });

    // ── 3. Logs de hoje ────────────────────────────────────────────────────────
    const dayStart = getLocalStartOfDay();
    const todayLogs = last30Logs.filter((l) => new Date(l.eventTime) >= dayStart);

    // ── 4. Métricas derivadas ─────────────────────────────────────────────────
    const hour = parseInt(localTime.slice(11, 13), 10);
    const periodLabel = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';

    // Categorias registradas hoje
    const ALL_CATEGORIES = ['WATER', 'FOOD', 'SLEEP', 'WORKOUT', 'POOP'];
    const registeredTodayUpper = new Set(todayLogs.map((l) => l.category.toUpperCase()));
    const missingCategories = ALL_CATEGORIES.filter((c) => !registeredTodayUpper.has(c));

    // Água hoje: soma dos primaryValue dos logs WATER (primaryValue = % da meta)
    const waterLogsToday = todayLogs.filter((l) => l.category.toLowerCase() === 'water');
    const waterPctToday = waterLogsToday.reduce((sum, l) => sum + l.primaryValue, 0);
    const waterMlToday = Math.round((waterPctToday / 100) * waterGoalMl);

    // Refeições hoje
    const mealsToday = todayLogs.filter((l) => l.category.toLowerCase() === 'food').length;

    // Sono da última noite
    const lastSleepLog = last30Logs.find((l) => l.category.toLowerCase() === 'sleep');
    const lastSleepScore = lastSleepLog ? lastSleepLog.primaryValue : null;

    // Frequência de treino nos últimos 7 dias
    const sevenDaysAgo = new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const workoutsThisWeek = last30Logs.filter(
      (l) => l.category.toLowerCase() === 'workout' && new Date(l.eventTime) >= sevenDaysAgo,
    ).length;

    // Dias desde o último treino
    const lastWorkoutLog = last30Logs.find((l) => l.category.toLowerCase() === 'workout');
    const daysSinceLastWorkout = lastWorkoutLog
      ? Math.floor((Date.now() - new Date(lastWorkoutLog.eventTime).getTime()) / 86_400_000)
      : null;

    // Resumo de frequência semanal (últimos 7 dias) por categoria
    const weeklyFrequency: Record<string, number> = {};
    for (const cat of ALL_CATEGORIES) {
      weeklyFrequency[cat] = last30Logs.filter(
        (l) => l.category.toUpperCase() === cat && new Date(l.eventTime) >= sevenDaysAgo,
      ).length;
    }

    // ── 4b. Progresso semanal (Weekly Streak Context) ─────────────────────
    const weeklyProgress = await getWeeklyProgress(userId);

    const PT_DAYS_FULL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const weeklyProgressSummary = weeklyProgress
      .map((day, i) => {
        const label = PT_DAYS_FULL[i];
        if (day.isFuture) return `${label}: -`;
        if (day.isToday) {
          return day.score !== null
            ? `${label}: Hoje (score parcial ${day.score}/100)`
            : `${label}: Hoje (sem logs ainda)`;
        }
        return day.score !== null ? `${label}: ${day.score}/100` : `${label}: sem registro`;
      })
      .join(' | ');

    // Detect streak of consecutive days with score >= 70 (excluding future days)
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

    // ── 5. Montar o contexto rico ─────────────────────────────────────────────
    const todayLogsSummary =
      todayLogs.length === 0
        ? 'Nenhum registro feito hoje ainda (primeira abertura do dia).'
        : todayLogs.map((l) => `- ${l.category.toUpperCase()}: score ${l.primaryValue}/100`).join('\n');

    const weeklyFreqSummary = Object.entries(weeklyFrequency)
      .map(([cat, count]) => `- ${cat}: ${count} registros nos últimos 7 dias`)
      .join('\n');

    const prompt = `
Você é a Nutri, assistente de saúde acolhedora e bem-humorada do app "Orgulho da Nutri".

## Contexto atual do usuário
- Hora local: ${hour}h (${periodLabel})
- Objetivo principal: ${mainGoal === 'fat_loss' ? 'emagrecer' : mainGoal === 'muscle_gain' ? 'ganhar massa' : 'saúde geral'}

## Logs de hoje
${todayLogsSummary}
- Água: ${waterMlToday}ml registrados de ${waterGoalMl}ml meta (${waterPctToday}%)
- Refeições: ${mealsToday} de ${mealsGoalPerDay} meta
- Sono da última noite: ${lastSleepScore !== null ? `${lastSleepScore}/100` : 'não registrado'}
- Pilares sem registro hoje: ${missingCategories.length > 0 ? missingCategories.join(', ') : 'nenhum — parabéns!'}

## Histórico recente (últimos 7 dias)
${weeklyFreqSummary}
- Treinos: ${workoutsThisWeek} de ${workoutGoalPerWeek} na semana (meta semanal)
- Dias desde o último treino: ${daysSinceLastWorkout !== null ? daysSinceLastWorkout : 'nunca registrou'}
- Meta de sono: ${sleepGoalHours}h por noite

## [CONTEXTO SEMANAL DO USUÁRIO]
Score diário consolidado (0–100) de cada dia desta semana ("sem registro" = nenhum log naquele dia):
${weeklyProgressSummary}
- Sequência de dias consecutivos com score >= 70 (excluindo hoje): ${currentStreak} dia(s)
- Score de ontem: ${yesterdayScore !== null ? `${yesterdayScore}/100` : 'sem registro'}

Instruções de uso do contexto semanal:
- Se currentStreak >= 2, elogie a consistência e motive a manter a sequência hoje.
- Se yesterdayScore for nulo ou < 40, encoraje o usuário a não quebrar a corrente e recomeçar bem hoje.
- Se a semana toda não tem registros, seja acolhedora e incentive o primeiro passo.
- Combine sempre com o contexto de hoje (hora, pilares ausentes, etc.).

## Regras de priorização (siga na ordem):
1. Se é manhã (< 10h) e não há NENHUM log hoje → priorize SLEEP (registrar o sono da noite anterior)
2. Se é tarde/noite (>= 17h) e WORKOUT está AUSENTE hoje E treinos abaixo da meta semanal → priorize WORKOUT
3. Se o usuário não registra treino há mais de 2 dias e a meta é >= 3/semana → mencione o treino
4. Se FOOD está ausente e já é almoço (>= 11h) ou jantar (>= 18h) → mencione refeição
5. Se todos os pilares urgentes do período estão cobertos → elogie e sugira água ou nada (null)
6. NUNCA sugira água como prioridade se já há logs de água hoje com >= 50% da meta

## Instruções de resposta
- Gere UMA mensagem curta (máx 2 frases), empática e motivadora.
- Cruze a hora do dia com os dados acima para ser específico e útil.
- Use emojis com moderação. Seja direta, nunca punitiva.
- Não invente dados que não estão no contexto.

Responda SOMENTE com um JSON válido neste formato exato (sem markdown, sem explicações):
{"message": "<texto da mensagem>", "cta": "<WORKOUT|SLEEP|WATER|FOOD|POOP|null>"}
`.trim();

    const rawText = await aiService.generateRawText(prompt);

    // Tenta fazer parse do JSON retornado
    let parsed: AiInsightResponse;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean) as AiInsightResponse;
    } catch {
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
