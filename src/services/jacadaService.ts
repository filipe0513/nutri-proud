import { prisma } from '@/lib/prisma';
import { aiService } from './aiService';
import { createJacadaNotification } from './notificationService';

interface JacadaInput {
  sugar: number;
  fat: number;
  alcohol: number;
}

type JacadaLog = { eventTime: Date; details: unknown };

function formatHistorySummary(logs: JacadaLog[]): string {
  if (logs.length === 0) return 'Nenhuma jacada registrada nos últimos 7 dias.';

  const now = new Date();
  return logs
    .map((log) => {
      const details = log.details as { sugar?: number; fat?: number; alcohol?: number } | null;
      const daysAgo = Math.round(
        (now.getTime() - new Date(log.eventTime).getTime()) / (1000 * 60 * 60 * 24)
      );
      const label = daysAgo === 0 ? 'Hoje (registro anterior)' : `Há ${daysAgo} dia${daysAgo > 1 ? 's' : ''}`;
      const sugar = details?.sugar ?? 0;
      const fat = details?.fat ?? 0;
      const alcohol = details?.alcohol ?? 0;
      return `- ${label}: Açúcar ${sugar}/5, Frituras ${fat}/5, Álcool ${alcohol}/5`;
    })
    .join('\n');
}

export const jacadaService = {
  async buildHistorySummary(userId: string): Promise<{ historySummary: string; escalationNote: string }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentJacadas = await prisma.dailyLog.findMany({
      where: {
        userId,
        category: 'jacada',
        eventTime: { gte: sevenDaysAgo },
      },
      orderBy: { eventTime: 'desc' },
      select: { eventTime: true, details: true },
    });

    const historySummary = formatHistorySummary(recentJacadas);

    const uniqueDays = new Set(
      recentJacadas.map((l) => new Date(l.eventTime).toDateString())
    );
    const today = new Date();
    let consecutiveDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (uniqueDays.has(d.toDateString())) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    const escalationNote =
      consecutiveDays >= 3
        ? `⚠️ ATENÇÃO: Este é o ${consecutiveDays}º dia consecutivo com jacada. O tom da bronca deve ser significativamente mais sério e urgente.`
        : consecutiveDays === 2
        ? 'Este é o 2º dia seguido com jacada. Mencione que está começando a virar hábito.'
        : '';

    return { historySummary, escalationNote };
  },

  async generateJacadaReaction(
    userId: string,
    logId: string | undefined,
    input: JacadaInput
  ): Promise<string> {
    const { sugar, fat, alcohol } = input;
    const { historySummary, escalationNote } = await this.buildHistorySummary(userId);

    const prompt = `Você é a Nutri, nutricionista direta e honesta que se importa de verdade com o usuário.
Seu papel NÃO é ser condescendente nem passar pano. Sua missão é dar uma bronca carinhosa, mas real.

O usuário acabou de registrar esta jacada:
- Açúcar/Doces: ${sugar}/5
- Frituras/Fast Food: ${fat}/5
- Álcool: ${alcohol}/5

Histórico dos últimos 7 dias:
${historySummary}

${escalationNote}

REGRAS OBRIGATÓRIAS:
1. Tom: direto, firme, sem eufemismos. Uma bronca real, não uma "passada de pano".
2. NUNCA elogie a ausência de uma categoria (ex: álcool 0 NÃO é conquista, é o mínimo esperado).
3. NUNCA minimize o deslize com frases como "tudo bem", "uma vez não faz mal", "acontece".
4. Se houver padrão repetido no histórico (ex: álcool aparecendo toda semana), diga claramente que virou rotina.
5. Se consecutiveDays >= 3, seja bem mais incisivo e urgente no alerta.
6. Foque nos itens que foram registrados (score > 0). Ignore completamente os que foram 0.
7. Máximo de 2 frases curtas e diretas + 1 emoji condizente com a gravidade (😬, 🫣, 🚨, 😤, 🙅‍♀️).
8. Escreva em português brasileiro, de forma natural e humana.`;

    const text = await aiService.generateRawText(prompt);

    if (logId) {
      prisma.dailyLog
        .findUnique({ where: { id: logId, userId } })
        .then((log) => {
          if (!log) return;
          const existingDetails = (log.details as Record<string, unknown>) ?? {};
          return prisma.dailyLog.update({
            where: { id: logId },
            data: { details: { ...existingDetails, nutri_reaction: text } },
          });
        })
        .catch(() => {/* silent */});
    }

    createJacadaNotification(userId, text).catch(() => {/* silent */});

    return text;
  },
};
