import { GoogleGenerativeAI } from '@google/generative-ai';

export const aiService = {
  /**
   * Envia o prompt e os logs resumidos para o modelo Gemini e retorna o texto gerado.
   */
  async generateInsightFromLogs(prompt: string, logsSummary: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('GEMINI_API_KEY não está definida. Retornando insight genérico.');
      return 'Você está indo muito bem! Continue cuidando da sua saúde.';
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Usando o modelo rápido e de baixo custo, conforme especificado na task
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Combina o system prompt rigoroso com os dados dos logs
      const fullPrompt = `${prompt}\n\nDados da semana:\n${logsSummary}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erro ao gerar insight com a IA:', error);
      throw new Error('Falha ao gerar o veredito da IA.');
    }
  },
};
