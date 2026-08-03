export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { createJacadaNotification } from '@/services/notificationService';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const jacadaReactionSchema = z.object({
  sugar: z.number().min(0).max(5),
  fat: z.number().min(0).max(5),
  alcohol: z.number().min(0).max(5),
  logId: z.string().uuid().optional(),
}).strict();

async function getUserId(): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

function buildHistorySummary(
  logs: Array<{ eventTime: Date; details: unknown }>
): string {
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

export async function POST(request: Request) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: 'Gemini API Key não configurada.' },
        { status: 500 }
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // Rate limit: 3 requests per minute per user
    const rl = rateLimit(`ai-jacada:${userId}`, 3, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = jacadaReactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sugar, fat, alcohol, logId } = parsed.data;

    // Busca histórico dos últimos 7 dias para contextualizar a bronca
    let historySummary = 'Nenhuma jacada registrada nos últimos 7 dias.';
    let consecutiveDays = 0;

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

    historySummary = buildHistorySummary(recentJacadas);

    // Contar dias consecutivos com jacada (incluindo hoje)
    const uniqueDays = new Set(
      recentJacadas.map((l) => new Date(l.eventTime).toDateString())
    );
    const today = new Date();
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Se logId foi fornecido, persiste a reação no DailyLog (fire-and-forget, silencioso)
    if (logId) {
      prisma.dailyLog.findUnique({ where: { id: logId, userId } })
        .then((log) => {
          if (!log) return;
          const existingDetails = (log.details as Record<string, unknown>) ?? {};
          return prisma.dailyLog.update({
            where: { id: logId },
            data: {
              details: { ...existingDetails, nutri_reaction: text },
            },
          });
        })
        .catch(() => {/* silent — não bloqueia a resposta */});
    }

    // Persiste a reação como notificação (fire-and-forget, silencioso)
    createJacadaNotification(userId, text).catch(() => {/* silent */});

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error('[Gemini API Error - Jacada]:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar reação.' },
      { status: 500 }
    );
  }
}
