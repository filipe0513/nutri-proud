import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/apiAuth';
import { progressService } from '@/services/progressService';

/**
 * GET /api/progress/history-weeks
 *
 * Returns the weekly history progress for the authenticated user.
 */
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const history = await progressService.getWeeklyHistory(userId);

    // Serialize Date objects to ISO strings for JSON transport
    const serialized = history.map((week) => ({
      ...week,
      startDate: week.startDate.toISOString(),
      endDate: week.endDate.toISOString(),
    }));

    return NextResponse.json(serialized, { status: 200 });
  } catch (error: unknown) {
    console.error('Erro na rota GET /api/progress/history-weeks:', error);
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Falha ao buscar histórico de semanas.', details },
      { status: 500 },
    );
  }
}
