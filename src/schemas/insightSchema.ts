import { z } from 'zod';

/** Formato JSON que a IA deve retornar */
export const aiInsightResponseSchema = z.object({
  message: z.string().min(1),
  cta: z.string().nullable().optional(),
});

/** Payload de entrada do endpoint POST /api/insights/generate */
export const generateInsightInputSchema = z.object({
  /** Hora local do usuário no formato ISO-8601 (ex: "2026-06-05T09:00:00-03:00") */
  localTime: z.string().datetime({ offset: true }),
});

export type AiInsightResponse = z.infer<typeof aiInsightResponseSchema>;
export type GenerateInsightInput = z.infer<typeof generateInsightInputSchema>;
