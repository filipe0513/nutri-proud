import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { createJacadaNotification } from '@/services/notificationService';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function getUserId(): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

export async function POST(request: Request) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: 'Gemini API Key não configurada.' },
        { status: 500 }
      );
    }

    const { sugar, fat, alcohol } = await request.json();

    if (sugar === undefined || fat === undefined || alcohol === undefined) {
      return NextResponse.json(
        { error: 'Os campos sugar, fat e alcohol são obrigatórios.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `O usuário registrou um deslize na dieta com nível ${sugar}/5 de açúcar, ${fat}/5 de gordura e ${alcohol}/5 de álcool. Escreva uma única frase (máx 15 palavras) reagindo a isso com humor leve, sem ser punitivo, usando um emoji. Ex: 5 de álcool? Amanhã a garrafa d'água será sua melhor amiga! 🍺`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Persiste a reação como notificação (fire-and-forget, silencioso)
    const userId = await getUserId();
    if (userId) {
      createJacadaNotification(userId, text).catch(() => {/* silent */});
    }

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error('Erro ao gerar reação da jacada:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar reação.' },
      { status: 500 }
    );
  }
}
