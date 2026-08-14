import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/types/roles';
import { dateRangeSchema } from '@/schemas/analyticsSchema';
import {
  getRetentionByCohort,
  getAnonymousConversionRate,
  getLogsDistributionByPillar,
  getAvgLogsPerActiveUser,
  getOnboardingFunnel,
} from '@/services/adminPatientsService';

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const rangeParsed = dateRangeSchema.safeParse({ from, to });
    const range = rangeParsed.success ? rangeParsed.data : undefined;

    const [retention, conversion, pillarDist, avgLogs, funnel] = await Promise.all([
      getRetentionByCohort(range),
      getAnonymousConversionRate(range),
      getLogsDistributionByPillar(range),
      getAvgLogsPerActiveUser(range),
      getOnboardingFunnel(range),
    ]);

    return NextResponse.json({ retention, conversion, pillarDist, avgLogs, funnel });
  } catch (error) {
    console.error('[admin/patients-metrics] Error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
