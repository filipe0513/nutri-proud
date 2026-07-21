import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const lifesaverSchema = z.object({
  scores: z.object({
    water: z.number().min(0).max(100),
    food: z.number().min(0).max(100),
    workout: z.number().min(0).max(100),
    sleep: z.number().min(0).max(100),
    poop: z.number().min(0).max(100),
  }),
}).strict();

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

    // Auth check — prevent unauthenticated Gemini credit consumption
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // Rate limit: 5 requests per minute per user
    const rl = rateLimit(`ai-lifesaver:${userId}`, 5, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = lifesaverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { scores } = parsed.data;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `O usuário está com pontuação baixa hoje. Ele tem os seguintes percentuais de meta concluídos: Água (${scores.water}%), Comida (${scores.food}%), Treino (${scores.workout}%), Sono (${scores.sleep}%), Intestino (${scores.poop}%).

Dê 3 dicas ultra-rápidas do que ele ainda pode fazer hoje à noite para melhorar os pontos específicos que estão baixos.

RETORNE APENAS HTML puro (sem bloco de código, sem markdown, sem explicações). Use exatamente estas classes Tailwind:
- Cada dica deve ser uma <div class="flex items-start gap-3 py-3 border-b border-neutral-100 last:border-0">
- Dentro: um <span class="text-xl flex-shrink-0"> com um emoji relevante ao pilar (💧🥗🏋️😴🌿)
- Depois: um <div class="flex-1"> com <p class="text-sm font-semibold text-neutral-700 leading-snug"> para o título da dica e <p class="text-xs text-neutral-500 mt-0.5 leading-relaxed"> para a explicação curta (1 linha).
- Envolva tudo em uma <div class="divide-y divide-neutral-100">.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error('Erro ao gerar dicas salva-vidas:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar dicas.' },
      { status: 500 }
    );
  }
}
