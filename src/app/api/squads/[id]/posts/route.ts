import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { getSquadPosts, createSquadPost } from '@/services/squadService';

const createPostSchema = z.object({
  content: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  type: z.enum(['USER_GENERATED', 'SYSTEM_MILESTONE']).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id: squadId } = await params;
    const posts = await getSquadPosts(squadId, session.user.id);
    return NextResponse.json({ posts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar posts.';
    const status = message.includes('Acesso negado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id: squadId } = await params;
    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    if (!parsed.data.content && !parsed.data.imageUrl) {
      return NextResponse.json({ error: 'O post precisa ter conteúdo ou imagem.' }, { status: 400 });
    }

    const post = await createSquadPost(squadId, session.user.id, parsed.data);
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar post.';
    const status = message.includes('Acesso negado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
