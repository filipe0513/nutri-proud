import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/types/roles';
import { getNutriFeed } from '@/services/teamService';

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

    const typesParam = req.nextUrl.searchParams.get('types');
    const types = typesParam ? typesParam.split(',').filter(Boolean) : undefined;

    const items = await getNutriFeed(session.user.id, types ? { types } : undefined);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('[dashboard/feed] Error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
