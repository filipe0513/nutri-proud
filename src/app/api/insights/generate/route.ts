export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/apiAuth';
import { insightService } from '@/services/insightService';
import { generateInsightInputSchema } from '@/schemas/insightSchema';

/**
 * POST /api/insights/generate
 * Body: { localTime: "<ISO-8601 com offset>" }
 *
 * Gera um novo insight contextual baseado na hora local e nos logs do dia,
 * persiste no banco e retorna o objeto criado.
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateInsightInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const insight = await insightService.generateContextualInsight(userId, parsed.data.localTime);
    return NextResponse.json(insight, { status: 201 });
  } catch (error: unknown) {
    console.error('[Gemini API Error - Insight Generate]:', error);
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Falha ao gerar insight.', details }, { status: 500 });
  }
}
