import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/types/roles';
import { nutritionistService } from '@/services/nutritionistService';
import { nutritionistProfileSchema } from '@/schemas/nutritionistSchema';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const allowedRoles: string[] = [UserRole.NUTRITIONIST, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const profile = await nutritionistService.getOwn(session.user.id);
    return NextResponse.json(profile ?? null);
  } catch (error) {
    console.error('[nutritionists/me] GET error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const allowedRoles: string[] = [UserRole.NUTRITIONIST, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body: unknown = await req.json();
    const parsed = nutritionistProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const profile = await nutritionistService.upsertOwn(session.user.id, parsed.data);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('[nutritionists/me] PUT error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
