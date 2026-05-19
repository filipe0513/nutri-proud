/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { jacadaSchema } from '@/schemas/logSchema';
import { logService } from '@/services/logService';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { PermissionError } from '@/services/userService';

async function getUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  
  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = jacadaSchema.parse(body);

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const result = await logService.registerJacada(userId, data);
    
    return NextResponse.json({ message: "Jacada registrada com sucesso!", result }, { status: 201 });
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Dados inválidos", details: error }, { status: 400 });
  }
}
