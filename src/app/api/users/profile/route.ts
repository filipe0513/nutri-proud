import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/apiAuth';
import { z } from 'zod';

const userProfilePayloadSchema = z.object({
  name: z.string().optional(),
  profile: z.object({
    weight_kg: z.number().min(30).max(300),
    height_cm: z.number().min(100).max(250),
    gender: z.enum(['male', 'female', 'other']).optional(),
    main_goal: z.enum(['fat_loss', 'muscle_gain', 'health']),
    body_fat_percentage: z.number().optional(),
  }).passthrough(),
  targets: z.object({
    water_ml_per_day: z.number().min(1000).max(8000),
    planned_meals: z.array(z.string()),
    sleep_hours_per_night: z.number().min(4).max(12),
    weekly_workouts: z.number().min(3).max(7),
  }).passthrough(),
  notification_preferences: z.record(
    z.string(),
    z.object({
      push: z.boolean().default(true),
      email: z.boolean().default(true),
      in_app: z.boolean().default(true),
    })
  ).optional(),
}).passthrough();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const parsed = userProfilePayloadSchema.safeParse(body);
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
        ...(data.name ? { name: data.name } : {}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profile: data.profile as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targets: data.targets as any,
        ...(data.notification_preferences ? { notification_preferences: data.notification_preferences } : {}),
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
