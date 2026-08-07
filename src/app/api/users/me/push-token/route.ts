import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { pushTokenSchema } from '@/schemas/pushTokenSchema';

async function getUserId(): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

/**
 * PATCH /api/users/me/push-token
 * Vincula o OneSignal Player ID ao usuário logado e marca push_enabled = true.
 */
export async function PATCH(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = pushTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { onesignal_id } = parsed.data;

    await prisma.user.update({
      where: { id: userId },
      data: {
        oneSignalId: onesignal_id,
        pushEnabled: true,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/users/me/push-token]', error);
    return NextResponse.json(
      { error: 'Falha ao salvar token push.' },
      { status: 500 }
    );
  }
}
