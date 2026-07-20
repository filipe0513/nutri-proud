/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { userService } from '@/services/userService';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const existingAnonId = cookieStore.get('anon_user_id')?.value;

    if (existingAnonId) {
      // Verifica se existe no banco
      const user = await prisma.user.findUnique({ where: { id: existingAnonId, is_anonymous: true } });
      if (user) {
        return NextResponse.json({ message: "Sessão anônima restaurada.", user }, { status: 200 });
      }
    }

    // Cria um novo usuário anônimo através da camada de serviço
    const user = await userService.createAnonymousUser();

    cookieStore.set('anon_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    });

    // Telemetria
    await prisma.systemEvent.create({
      data: {
        eventName: 'AUTH_ANONYMOUS_SUCCESS',
        userId: user.id,
      }
    });

    return NextResponse.json({ message: "Visitante criado com sucesso.", user }, { status: 201 });
  } catch (error: any) {
    console.error("Erro na rota anônima:", error);
    return NextResponse.json({ error: "Falha ao criar visitante.", details: error.message || error }, { status: 500 });
  }
}
