import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deletePost } from '@/services/squadService';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id: postId } = await params;

    await deletePost(postId, session.user.id);

    return NextResponse.json({ message: 'Post apagado com sucesso.' }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao apagar post.';
    const status = message.includes('Acesso negado') ? 403 : message.includes('não encontrado') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
