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

/**
 * PATCH /api/insights/[id]/view
 *
 * Marca o insight como lido (is_viewed = true).
 * Idempotente — chamar múltiplas vezes é seguro.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID do insight não fornecido.' }, { status: 400 });
    }

    const updated = await insightService.markAsViewed(id, userId);

    if (!updated) {
      return NextResponse.json(
        { error: 'Insight não encontrado ou não pertence ao usuário.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, insight: updated }, { status: 200 });
  } catch (error: unknown) {
    console.error('Erro na rota PATCH /api/insights/[id]/view:', error);
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Falha ao marcar insight.', details }, { status: 500 });
  }
}
