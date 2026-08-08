import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/apiAuth';
import { getPostComments, createComment } from '@/services/teamService';
import { createCommentSchema } from '@/schemas/postSchema';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
    }

    const { id: postId } = await params;
    const comments = await getPostComments(postId, userId);
    return NextResponse.json({ comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await req.json();
    const parsed = createCommentSchema.parse({ ...body, postId });

    const comment = await createComment(postId, userId, parsed.text);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
