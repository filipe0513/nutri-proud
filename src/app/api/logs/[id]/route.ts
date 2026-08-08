/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { logSchema, foodDetailsSchema } from '@/schemas/logSchema';
import { getUserId } from '@/lib/apiAuth';
import { logService } from '@/services/logService';
import { PermissionError } from '@/services/userService';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = logSchema.parse(body);

    if (data.category === 'food') {
      foodDetailsSchema.parse(data.details);
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const updatedLog = await logService.updateDailyLog(id, userId, data);
    
    return NextResponse.json({ message: "Atualizado com sucesso!", log: updatedLog }, { status: 200 });
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Dados inválidos", details: error }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await logService.deleteDailyLog(id, userId);

    return NextResponse.json({ message: "Registro apagado com sucesso!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Falha ao apagar registro", details: error }, { status: 500 });
  }
}

