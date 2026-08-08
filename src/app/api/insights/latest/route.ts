import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/apiAuth';
import { insightService } from '@/services/insightService';

/**
 * GET /api/insights/latest
 *
 * Retorna o insight mais recente do usuário (independente de is_viewed).
 * O frontend usa is_viewed para decidir se exibe o pop-up/drawer ou não.
 */
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const insight = await insightService.getLatestInsight(userId);

    if (!insight) {
      return NextResponse.json({ insight: null }, { status: 200 });
    }

    return NextResponse.json({ insight }, { status: 200 });
  } catch (error: unknown) {
    console.error('Erro na rota GET /api/insights/latest:', error);
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Falha ao buscar insight.', details }, { status: 500 });
  }
}
