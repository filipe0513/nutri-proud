import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

async function getUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  
  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        profile: data.profile,
        targets: data.targets,
      }
    });
    
    return NextResponse.json({ message: "Perfil salvo com sucesso!", user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao salvar perfil", details: error }, { status: 400 });
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    return NextResponse.json({ profile: user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao buscar perfil", details: error }, { status: 400 });
  }
}
