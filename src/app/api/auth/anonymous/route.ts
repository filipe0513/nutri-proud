import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const existingAnonId = cookieStore.get('anon_user_id')?.value;

    if (existingAnonId) {
      // Verifica se existe no banco
      const user = await prisma.user.findUnique({ where: { id: existingAnonId, is_anonymous: true } });
      if (user) {
        return NextResponse.json({ message: "Sessão anônima restaurada.", user }, { status: 200 });
      }
    }

    // Cria um novo usuário anônimo
    const user = await prisma.user.create({
      data: {
        is_anonymous: true,
        name: 'Visitante',
        profile: {}, // defaults
        targets: {
            water_ml_per_day: 2000,
            meals_per_day: 4,
            sleep_hours_per_night: 8,
            weekly_workouts: { cardio: 3, strength: 3 }
        }
      }
    });

    cookieStore.set('anon_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    });

    return NextResponse.json({ message: "Visitante criado com sucesso.", user }, { status: 201 });
  } catch (error: any) {
    console.error("Erro na rota anônima:", error);
    return NextResponse.json({ error: "Falha ao criar visitante.", details: error.message || error }, { status: 500 });
  }
}
