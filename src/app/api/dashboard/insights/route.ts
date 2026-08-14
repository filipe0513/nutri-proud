import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/types/roles';
import { dateRangeSchema } from '@/schemas/analyticsSchema';
import {
  getPatientGoalAdherence,
  getBrokenStreaks,
  getTeamWeakestPillars,
  getSocialDisengagement,
  getInactivePatients,
} from '@/services/dashboardInsightsService';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
    }

    const allowedRoles: string[] = [UserRole.NUTRITIONIST, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const params = req.nextUrl.searchParams;
    const rawFrom = params.get('from');
    const rawTo = params.get('to');

    let range: { from: string; to: string } | undefined;
    if (rawFrom && rawTo) {
      const parsed = dateRangeSchema.safeParse({ from: rawFrom, to: rawTo });
      if (!parsed.success) {
        return NextResponse.json({ error: 'Parametros de data invalidos.' }, { status: 400 });
      }
      range = parsed.data;
    }

    const inactiveDays = parseInt(params.get('inactiveDays') ?? '7', 10);
    const disengageDays = parseInt(params.get('disengageDays') ?? '7', 10);

    const nutriId = session.user.id;

    const [goalAdherence, brokenStreaks, weakestPillars, socialDisengagement, inactivePatients] =
      await Promise.all([
        getPatientGoalAdherence(nutriId, range),
        getBrokenStreaks(nutriId),
        getTeamWeakestPillars(nutriId, range),
        getSocialDisengagement(nutriId, disengageDays),
        getInactivePatients(nutriId, inactiveDays),
      ]);

    return NextResponse.json({
      goalAdherence,
      brokenStreaks,
      weakestPillars,
      socialDisengagement,
      inactivePatients,
    });
  } catch (error) {
    console.error('[dashboard/insights] Error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
