import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { challengeSchema } from '@/schemas/challengeSchema';
import { createChallenge } from '@/services/challengeService';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const parsed = challengeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await createChallenge(session.user.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const isUserError = message === 'Código já em uso. Escolha outro.';
    console.error('[POST /api/challenges]', error);
    return NextResponse.json({ error: message }, { status: isUserError ? 409 : 500 });
  }
}
