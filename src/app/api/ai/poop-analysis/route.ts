export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserId } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const poopAnalysisSchema = z.object({
  state: z.enum(['hard', 'liquid', 'gas', 'normal']),
  logId: z.string().uuid().optional(),
}).strict();

const STATE_LABELS: Record<string, string> = {
  hard: '🧱 Ressecado / Difícil',
  liquid: '💦 Solto / Líquido',
  gas: '💨 Gases / Desconforto',
  normal: '😌 Suave / Normal',
};

const MEAL_LABELS: Record<string, string> = {
  'Café da Manhã': 'Café da Manhã',
  'Almoço': 'Almoço',
  'Jantar': 'Jantar',
  'Lanche da Tarde': 'Lanche da Tarde',
  'Ceia': 'Ceia',
};

function formatMealType(id: string): string {
  return MEAL_LABELS[id] ?? id;
}

function formatDeviation(value: number): string {
  if (value === 0) return '0%';
  return value > 0 ? `+${value}%` : `${value}%`;
}

interface DailyLogRow {
  eventTime: Date;
  category: string;
  details: unknown;
}

interface FoodDetails {
  meal_type?: string;
  factors?: { protein?: number; carbs?: number; fats?: number; fiber?: number };
}

interface JacadaDetails {
  sugar?: number;
  fat?: number;
  alcohol?: number;
}

interface WaterDetails {
  quantity_ml?: number;
}

interface PoopDetails {
  state?: string;
}

function buildDailyContextSummary(logs: DailyLogRow[]): string {
  // Group logs by local date string (dd/MM), ordered chronologically
  const byDay: Record<string, DailyLogRow[]> = {};

  for (const log of logs) {
    const dayKey = format(new Date(log.eventTime), 'dd/MM', { locale: ptBR });
    if (!byDay[dayKey]) byDay[dayKey] = [];
    byDay[dayKey].push(log);
  }

  if (Object.keys(byDay).length === 0) {
    return 'Nenhum registro encontrado nos últimos 3 dias.';
  }

  const lines: string[] = [];

  for (const [day, dayLogs] of Object.entries(byDay)) {
    lines.push(`📅 ${day}:`);

    // --- Food ---
    const foodLogs = dayLogs.filter((l) => l.category === 'food');
    if (foodLogs.length > 0) {
      lines.push('  Alimentação:');
      for (const fl of foodLogs) {
        const d = fl.details as FoodDetails | null;
        const mealType = formatMealType(d?.meal_type ?? 'Refeição');
        const f = d?.factors ?? {};
        const protein = formatDeviation(f.protein ?? 0);
        const carbs = formatDeviation(f.carbs ?? 0);
        const fats = formatDeviation(f.fats ?? 0);
        const fiber = formatDeviation(f.fiber ?? 0);
        lines.push(
          `    - ${mealType}: Proteínas ${protein}, Carbos ${carbs}, Gorduras ${fats}, Fibras ${fiber}`,
        );
      }
    } else {
      lines.push('  Alimentação: (nenhum registro)');
    }

    // --- Jacada ---
    const jacadaLogs = dayLogs.filter((l) => l.category === 'jacada');
    if (jacadaLogs.length > 0) {
      const jLines: string[] = [];
      for (const jl of jacadaLogs) {
        const d = jl.details as JacadaDetails | null;
        jLines.push(
          `Açúcar ${d?.sugar ?? 0}/5, Frituras ${d?.fat ?? 0}/5, Álcool ${d?.alcohol ?? 0}/5`,
        );
      }
      lines.push(`  Jacada: ${jLines.join(' | ')}`);
    } else {
      lines.push('  Jacada: (nenhuma)');
    }

    // --- Water (aggregate per day) ---
    const waterLogs = dayLogs.filter((l) => l.category === 'water');
    const totalWaterMl = waterLogs.reduce((acc, wl) => {
      const d = wl.details as WaterDetails | null;
      return acc + (d?.quantity_ml ?? 0);
    }, 0);
    lines.push(
      `  Água: ${totalWaterMl > 0 ? `${totalWaterMl}ml` : '(não registrado)'}`,
    );

    // --- Other poop logs ---
    const poopLogs = dayLogs.filter((l) => l.category === 'poop');
    if (poopLogs.length > 0) {
      const pLabels = poopLogs.map((pl) => {
        const d = pl.details as PoopDetails | null;
        return STATE_LABELS[d?.state ?? ''] ?? d?.state ?? 'desconhecido';
      });
      lines.push(`  Intestino: ${pLabels.join(', ')}`);
    } else {
      lines.push('  Intestino: (nenhum registro)');
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}

export async function POST(request: Request) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: 'Gemini API Key não configurada.' },
        { status: 500 },
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // Rate limit: 3 requests per minute per user
    const rl = rateLimit(`ai-poop:${userId}`, 3, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = poopAnalysisSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { state, logId } = parsed.data;

    // Only analyse non-normal states
    if (state === 'normal') {
      return NextResponse.json({ analysis: null });
    }

    let contextSummary = 'Nenhum dado disponível.';

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentLogs = await prisma.dailyLog.findMany({
      where: {
        userId,
        category: { in: ['poop', 'food', 'jacada', 'water'] },
        eventTime: { gte: threeDaysAgo },
      },
      orderBy: { eventTime: 'asc' },
      select: { eventTime: true, category: true, details: true },
    });

    contextSummary = buildDailyContextSummary(recentLogs as DailyLogRow[]);

    const currentStateLabel = STATE_LABELS[state] ?? state;

    const now = new Date();
    const localTimeString = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const hasFoodOrWaterRecent = recentLogs.some(l => 
      (l.category === 'food' || l.category === 'water' || l.category === 'jacada') &&
      now.getTime() - new Date(l.eventTime).getTime() <= 48 * 60 * 60 * 1000
    );

    let rule2 = '';
    if (!hasFoodOrWaterRecent) {
      rule2 = `REGRA CRÍTICA: Não há logs de refeições/água recentes. NÃO invente um motivo. Explique que o intestino reflete o que foi comido ontem e pergunte se o usuário esqueceu de registrar a refeição/jacada.`;
    }

    const prompt = `Você é a Nutri, nutricionista analítica e empática.
Analise os dados dos últimos 3 dias e identifique se há correlação clara com o registro de intestino atual.

Data e hora atual: ${localTimeString}

Registro atual de intestino: ${currentStateLabel}

--- Últimos 3 dias ---
${contextSummary}

${rule2}

REGRAS OBRIGATÓRIAS:
1. Só responda se houver correlação CLARA e ESPECÍFICA nos dados fornecidos. Caso contrário, retorne EXATAMENTE o JSON: {"analysis": null}
2. Se houver correlação, forneça uma análise objetiva (2-3 frases curtas) identificando a causa provável e 1 sugestão prática e concreta.
3. Correlações relevantes a observar:
   - Fibras baixas (valores negativos) nos dias anteriores → ressecado/duro
   - Gorduras muito altas + jacada elevada → solto/líquido
   - Álcool + frituras → solto/líquido ou gases
   - Água insuficiente (abaixo de 1.500ml) → ressecado
   - Padrão consistente ao longo de vários dias
4. Use APENAS os dados fornecidos. Não presuma o que não foi registrado.
5. Tom: educativo, empático, direto. Não alarmista, não condescendente.
6. Retorne JSON válido e nada mais: {"analysis": "texto aqui"} ou {"analysis": null}
7. Escreva em português brasileiro, de forma natural e humana.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text().trim();

    let analysis: string | null = null;
    try {
      const parsedJson = JSON.parse(rawText) as { analysis: string | null };
      analysis = parsedJson.analysis ?? null;
    } catch {
      // JSON parsing failed → treat as no correlation found
      analysis = null;
    }

    // Persist the analysis in the DailyLog (fire-and-forget, does not block response)
    if (logId && analysis) {
      prisma.dailyLog
        .findUnique({ where: { id: logId, userId } })
        .then((log) => {
          if (!log) return;
          const existingDetails = (log.details as Record<string, unknown>) ?? {};
          return prisma.dailyLog.update({
            where: { id: logId },
            data: {
              details: { ...existingDetails, nutri_analysis: analysis },
            },
          });
        })
        .catch(() => {/* silent */});
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('[Gemini API Error - Poop]:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar análise.' },
      { status: 500 },
    );
  }
}
