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
    console.error('[POST /api/challenges]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
