import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '../aiService';

// Mock the Gemini SDK
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: vi.fn().mockReturnValue('Mocked insight from AI: Você está bebendo muita água, parabéns!'),
            },
          }),
        };
      }
    },
  };
});

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate an insight from logs', async () => {
    // Definimos uma variável de ambiente fake apenas para garantir que não caia no early return de "sem apiKey"
    process.env.GEMINI_API_KEY = 'fake_api_key';

    const prompt = 'Seja legal e analise.';
    const logsSummary = 'Média Geral: 80/100';

    const insight = await aiService.generateInsightFromLogs(prompt, logsSummary);

    expect(insight).toBe('Mocked insight from AI: Você está bebendo muita água, parabéns!');
  });
});
