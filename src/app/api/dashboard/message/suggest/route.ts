import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/types/roles';
import { generateAiMessageSuggestion } from '@/services/nutriMessageService';
import { aiSuggestionSchema } from '@/schemas/nutriMessageSchema';
import { rateLimit } from '@/lib/rateLimit';

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

    // Rate limit: 10 suggestions per hour per nutri
    const rl = rateLimit(`ai-suggest:${session.user.id}`, 10, 60 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Limite de sugestoes atingido. Tente novamente mais tarde.' },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = aiSuggestionSchema.parse(body);

    const suggestion = await generateAiMessageSuggestion(
      session.user.id,
      parsed.patientId,
      parsed.tone,
    );

    return NextResponse.json({ suggestion });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
