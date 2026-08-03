import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { getTeamById, updateTeam, deleteTeam } from '@/services/teamService';

const updateTeamSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório').max(50).optional(),
  description: z.string().max(200).optional(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const team = await getTeamById(params.id, session.user.id);
    return NextResponse.json({ team });
  } catch (err) {
    console.error(`[GET /api/teams/${params.id}]`, err);
    const msg = err instanceof Error ? err.message : 'Erro ao buscar team.';
    const status = msg.includes('Acesso negado') || msg.includes('não encontrado') ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const team = await updateTeam(params.id, session.user.id, parsed.data);
    return NextResponse.json({ team });
  } catch (err) {
    console.error(`[PUT /api/teams/${params.id}]`, err);
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar team.';
    const status = msg.includes('Acesso negado') || msg.includes('não encontrado') ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    await deleteTeam(params.id, session.user.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(`[DELETE /api/teams/${params.id}]`, err);
    const msg = err instanceof Error ? err.message : 'Erro ao apagar team.';
    const status = msg.includes('Acesso negado') || msg.includes('não encontrado') ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
