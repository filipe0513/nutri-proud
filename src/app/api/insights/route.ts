import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { insightService } from '@/services/insightService';

async function getUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  
  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const generate = searchParams.get('generate') === 'true';

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const data = await insightService.getWeeklyInsights(userId, generate);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Erro na rota de insights:", error);
    const details = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Falha ao gerar insights.", details }, { status: 500 });
  }
}
