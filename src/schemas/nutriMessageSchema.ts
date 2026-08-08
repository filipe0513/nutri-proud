import { z } from 'zod';

export const sendNutriMessageSchema = z.object({
  patientId: z.string().uuid('ID do paciente invalido.'),
  message: z.string().min(1, 'A mensagem nao pode estar vazia.').max(500),
}).strict();

export const aiSuggestionSchema = z.object({
  patientId: z.string().uuid('ID do paciente invalido.'),
  tone: z.enum(['encouragement', 'congratulations', 'concern', 'general']),
}).strict();

export type SendNutriMessage = z.infer<typeof sendNutriMessageSchema>;
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
