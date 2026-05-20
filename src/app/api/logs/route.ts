/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { logSchema, foodDetailsSchema } from '@/schemas/logSchema';
import { prisma } from '@/lib/prisma';
import { DailyLog } from '@prisma/client';

import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { logService, getLocalDayInterval } from '@/services/logService';
import { PermissionError } from '@/services/userService';


async function getUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  
  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = logSchema.parse(body);

    if (data.category === 'food') {
      foodDetailsSchema.parse(data.details);
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const log = await logService.saveLog(userId, data);
    
    return NextResponse.json({ message: "Validado e salvo com sucesso!", log }, { status: 201 });
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Dados inválidos", details: error }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const categoriesParam = searchParams.get('categories');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Construção do objeto where
    const where: any = { userId };

    if (categoriesParam) {
      where.category = { in: categoriesParam.split(',') };
    }

    if (startDateParam || endDateParam) {
      where.eventTime = {};
      if (startDateParam) where.eventTime.gte = getLocalDayInterval(startDateParam).start;
      if (endDateParam) where.eventTime.lte = getLocalDayInterval(endDateParam).end;
    }


    const logs = await prisma.dailyLog.findMany({
      where,
      orderBy: { eventTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Mapear do formato Prisma pro formato do Frontend
    const formattedLogs = logs.map((log: DailyLog) => ({
      id: log.id,
      created_at: log.createdAt.toISOString(),
      event_time: log.eventTime.toISOString(),
      category: log.category,
      primary_value: log.primaryValue,
      details: log.details,
    }));

    return NextResponse.json({ logs: formattedLogs, hasMore: logs.length === limit }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao buscar logs", details: error }, { status: 400 });
  }
}
