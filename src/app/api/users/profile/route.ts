import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { profileSettingsSchema } from '@/schemas/profileSchema';

async function getUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  
  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Validate with Zod to prevent mass assignment (e.g. setting role/is_anonymous)
    const parsed = profileSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        profile: {
          weight_kg: data.weight_kg,
          height_cm: data.height_cm,
          main_goal: data.goal,
        },
        targets: {
          water_ml_per_day: data.water_target_ml,
          sleep_hours_per_night: data.sleep_target_hours,
          weekly_workouts: data.weekly_workouts,
          planned_meals: data.planned_meals,
        },
      }
    });
    
    return NextResponse.json({ message: "Perfil salvo com sucesso!", user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao salvar perfil", details: error }, { status: 400 });
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    return NextResponse.json({ profile: user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao buscar perfil", details: error }, { status: 400 });
  }
}
