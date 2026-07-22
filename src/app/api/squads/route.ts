import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { getMySquads, createSquad } from '@/services/squadService';

const createSquadSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório').max(50),
  description: z.string().max(200).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const squads = await getMySquads(session.user.id);
    return NextResponse.json({ squads });
  } catch (err) {
    console.error('[GET /api/squads]', err);
    return NextResponse.json({ error: 'Erro ao buscar squads.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSquadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const squad = await createSquad(session.user.id, parsed.data);
    return NextResponse.json(squad, { status: 201 });
  } catch (err) {
    console.error('[POST /api/squads]', err);
    return NextResponse.json({ error: 'Erro ao criar squad.' }, { status: 500 });
  }
}
