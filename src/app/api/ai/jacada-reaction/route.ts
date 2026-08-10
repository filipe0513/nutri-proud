export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/apiAuth';
import { jacadaService } from '@/services/jacadaService';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const jacadaReactionSchema = z.object({
  sugar: z.number().min(0).max(5),
  fat: z.number().min(0).max(5),
  alcohol: z.number().min(0).max(5),
  logId: z.string().uuid().optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

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
    const text = await jacadaService.generateJacadaReaction(userId, logId, { sugar, fat, alcohol });

    return NextResponse.json({ message: text });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Jacada Reaction Error]:', errMsg);
    return NextResponse.json(
      { error: 'Erro interno ao gerar reação.' },
      { status: 500 }
    );
  }
}
