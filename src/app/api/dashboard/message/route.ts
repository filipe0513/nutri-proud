import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/types/roles';
import { sendNutriMessage } from '@/services/nutriMessageService';
import { sendNutriMessageSchema } from '@/schemas/nutriMessageSchema';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
    }

    const allowedRoles: string[] = [UserRole.NUTRITIONIST, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = sendNutriMessageSchema.parse(body);

    await sendNutriMessage(session.user.id, parsed.patientId, parsed.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
