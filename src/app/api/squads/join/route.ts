import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { joinSquadByCode } from '@/services/squadService';

const joinSchema = z.object({
  inviteCode: z.string().min(1, 'O código é obrigatório.'),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const squad = await joinSquadByCode(session.user.id, parsed.data.inviteCode);
    return NextResponse.json(squad, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao entrar no squad.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
