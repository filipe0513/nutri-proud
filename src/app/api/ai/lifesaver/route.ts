import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: Request) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: 'Gemini API Key não configurada.' },
        { status: 500 }
      );
    }

    const { scores } = await request.json();

    if (!scores) {
      return NextResponse.json(
        { error: 'Os scores são obrigatórios.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `O usuário está com pontuação baixa hoje. Ele tem os seguintes percentuais de meta concluídos: Água (${scores.water}%), Comida (${scores.food}%), Treino (${scores.workout}%), Sono (${scores.sleep}%), Intestino (${scores.poop}%). Dê 3 dicas ultra-rápidas, em formato de lista curta com bullets, do que ele ainda pode fazer hoje à noite para melhorar esses pontos específicos que estão baixos.`;

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
