import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/apiAuth';
import { reportQuerySchema } from '@/schemas/reportSchema';
import { reportService } from '@/services/reportService';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const parsed = reportQuerySchema.safeParse({ startDate, endDate });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // Fetch user targets so the report service can score pillars correctly
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targets: true },
    });

    const report = await reportService.generateReport(
      userId,
      parsed.data.startDate,
      parsed.data.endDate,
      user?.targets ?? undefined
    );

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error('[/api/reports] Error:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar relatório.' },
      { status: 500 }
    );
  }
}
