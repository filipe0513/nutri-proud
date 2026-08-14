import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { nutritionistService } from '@/services/nutritionistService';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;

    const profile = await nutritionistService.getPublic(id, isAuthenticated);
    if (!profile) {
      return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (error) {
    console.error('[nutritionists/[id]] GET error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
