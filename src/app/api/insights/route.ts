export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/apiAuth';
import { insightService } from '@/services/insightService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const generate = searchParams.get('generate') === 'true';

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const data = await insightService.getWeeklyInsights(userId, generate);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("[Gemini API Error - Insight GET]:", error);
    const details = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Falha ao gerar insights.", details }, { status: 500 });
  }
}
