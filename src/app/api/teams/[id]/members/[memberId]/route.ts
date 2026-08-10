import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { removeTeamMember } from '@/services/teamService';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; memberId: string }> },
) {
  const params = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    await removeTeamMember(params.id, session.user.id, params.memberId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(`[DELETE /api/teams/${params.id}/members/${params.memberId}]`, err);
    const msg = err instanceof Error ? err.message : 'Erro ao remover membro.';
    const status = msg.includes('Acesso negado') || msg.includes('não encontrado') ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
