import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { reportQuerySchema } from '@/schemas/reportSchema';
import { reportService } from '@/services/reportService';

async function getUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

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

    const report = await reportService.generateReport(
      userId,
      parsed.data.startDate,
      parsed.data.endDate
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
