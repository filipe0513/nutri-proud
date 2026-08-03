import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { getMyTeams, createTeam } from '@/services/teamService';

const createTeamSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório').max(50),
  description: z.string().max(200).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const teams = await getMyTeams(session.user.id);
    return NextResponse.json({ teams });
  } catch (err) {
    console.error('[GET /api/teams]', err);
    return NextResponse.json({ error: 'Erro ao buscar teams.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const team = await createTeam(session.user.id, parsed.data);
    return NextResponse.json(team, { status: 201 });
  } catch (err) {
    console.error('[POST /api/teams]', err);
    return NextResponse.json({ error: 'Erro ao criar team.' }, { status: 500 });
  }
}
