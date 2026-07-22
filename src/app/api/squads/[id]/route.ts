import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { getSquadById, updateSquad, deleteSquad } from '@/services/squadService';

const updateSquadSchema = z.object({
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

    const squad = await getSquadById(params.id, session.user.id);
    return NextResponse.json({ squad });
  } catch (err) {
    console.error(`[GET /api/squads/${params.id}]`, err);
    return NextResponse.json({ error: 'Erro ao buscar squad.' }, { status: 500 });
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
    const parsed = updateSquadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const squad = await updateSquad(params.id, session.user.id, parsed.data);
    return NextResponse.json({ squad });
  } catch (err) {
    console.error(`[PUT /api/squads/${params.id}]`, err);
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar squad.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    await deleteSquad(params.id, session.user.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(`[DELETE /api/squads/${params.id}]`, err);
    const msg = err instanceof Error ? err.message : 'Erro ao apagar squad.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
