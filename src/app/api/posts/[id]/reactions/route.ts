import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { togglePostReaction } from '@/services/squadService';

const reactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await request.json();
    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Emoji inválido.' }, { status: 400 });
    }

    await togglePostReaction(postId, session.user.id, parsed.data.emoji);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/posts/[id]/reactions]', err);
    return NextResponse.json({ error: 'Erro ao reagir ao post.' }, { status: 500 });
  }
}
