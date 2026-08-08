import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/types/roles';
import { getPatientRadar } from '@/services/teamService';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
    }

    const allowedRoles: string[] = [UserRole.NUTRITIONIST, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const radar = await getPatientRadar(session.user.id);
    return NextResponse.json({ radar });
  } catch (error) {
    console.error('[dashboard/radar] Error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
