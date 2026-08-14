import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { nutritionistService } from '@/services/nutritionistService';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;

    const city = req.nextUrl.searchParams.get('city') ?? undefined;
    const uf = req.nextUrl.searchParams.get('uf') ?? undefined;

    const profiles = await nutritionistService.list({ city, uf, isAuthenticated });
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('[nutritionists] GET error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
