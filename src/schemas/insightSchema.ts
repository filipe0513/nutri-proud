import { z } from 'zod';

/** Formato JSON que a IA deve retornar */
export const aiInsightResponseSchema = z.object({
  message: z.string().min(1).max(2000),
  cta: z.string().max(500).nullable().optional(),
});

/** Payload de entrada do endpoint POST /api/insights/generate */
export const generateInsightInputSchema = z.object({
  /** Hora local do usuário no formato ISO-8601 (ex: "2026-06-05T09:00:00-03:00") */
  localTime: z.string().max(100).datetime({ offset: true }),
}).strict();

export type AiInsightResponse = z.infer<typeof aiInsightResponseSchema>;
export type GenerateInsightInput = z.infer<typeof generateInsightInputSchema>;
