import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { joinChallenge } from '@/services/challengeService';

const joinSchema = z.object({
  inviteCode: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const team = await joinChallenge(session.user.id, parsed.data.inviteCode);
    return NextResponse.json(team);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message === 'Código de convite inválido.' || message === 'Desafio encerrado.'
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
