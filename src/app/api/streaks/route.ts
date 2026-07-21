import { NextResponse } from 'next/server';
import { streakService } from '@/services/streakService';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

async function getUserId(): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

/**
 * GET /api/streaks
 * Returns the best streak across all categories for the authenticated user.
 */
export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    // Fetch user targets to get weekly workout goal
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const targets = (user.targets ?? {}) as Record<string, number>;
    const weeklyWorkoutsTarget: number = targets.weekly_workouts ?? 3;

    // Calculate streaks in parallel
    const [workoutStreak, waterStreak, foodStreak, sleepStreak, poopStreak] =
      await Promise.all([
        streakService.calculateWorkoutWeeklyStreak(userId, weeklyWorkoutsTarget),
        streakService.calculateDailyStreak(userId, 'WATER'),
        streakService.calculateDailyStreak(userId, 'FOOD'),
        streakService.calculateDailyStreak(userId, 'SLEEP'),
        streakService.calculateDailyStreak(userId, 'POOP'),
      ]);

    // Find the best daily streak across non-workout categories
    const dailyStreaks = [
      { category: 'WATER', streak: waterStreak },
      { category: 'FOOD', streak: foodStreak },
      { category: 'SLEEP', streak: sleepStreak },
      { category: 'POOP', streak: poopStreak },
    ];
    const bestDaily = dailyStreaks.reduce((best, curr) =>
      curr.streak > best.streak ? curr : best
    );

    return NextResponse.json({
      workout: { streak: workoutStreak, type: 'weekly' },
      bestDaily: { ...bestDaily, type: 'daily' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao calcular streaks:', error);
    return NextResponse.json({ error: 'Falha ao calcular streaks', details: msg }, { status: 500 });
  }
}
