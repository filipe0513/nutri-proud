import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/apiAuth';
import { progressService } from '@/services/progressService';

/**
 * GET /api/progress/weekly
 *
 * Returns the 7-day weekly progress for the authenticated user.
 * Each item: { date, dayLabel, score, isToday, isFuture }
 */
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const weeklyProgress = await progressService.getWeeklyProgress(userId);

    // Serialize Date objects to ISO strings for JSON transport
    const serialized = weeklyProgress.map((day) => ({
      ...day,
      date: day.date.toISOString(),
    }));

    return NextResponse.json(serialized, { status: 200 });
  } catch (error: unknown) {
    console.error('Erro na rota GET /api/progress/weekly:', error);
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Falha ao buscar progresso semanal.', details },
      { status: 500 },
    );
  }
}
