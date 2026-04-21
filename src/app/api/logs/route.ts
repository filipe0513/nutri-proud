import { NextResponse } from 'next/server';
import { logSchema, foodDetailsSchema } from '@/schemas/logSchema';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = logSchema.parse(body);

    // Validação extra se for Comida
    if (data.category === 'food') {
      foodDetailsSchema.parse(data.details);
    }

    // Por enquanto, apenas logamos no servidor para teste
    console.log("Dados válidos recebidos:", data);

    // TODO: Usar ID de usuário real após implementar Auth
    const MOCK_USER_ID = "mock-user-1"; 

    const log = await prisma.dailyLog.create({
      data: {
        category: data.category,
        primaryValue: data.primary_value,
        details: data.details,
        eventTime: new Date(),
        userId: MOCK_USER_ID,
      }
    });
    
    return NextResponse.json({ message: "Validado e salvo com sucesso!", log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Dados inválidos", details: error }, { status: 400 });
  }
}
