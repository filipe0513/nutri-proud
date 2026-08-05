import { z } from 'zod';

// Schema para os detalhes de Comida (JSONB)
export const foodDetailsSchema = z.object({
  meal_type: z.string().min(1, 'Tipo de refeição é obrigatório').max(100),
  factors: z.object({
    carbs: z.number().min(-50).max(50),
    protein: z.number().min(-50).max(50),
    fats: z.number().min(-50).max(50),
    fiber: z.number().min(-50).max(50),
  }).optional(),
  note: z.string().max(500).optional(),
}).strict();

// Schema para os detalhes de Sono
export const sleepDetailsSchema = z.object({
  duration_hours: z.number().min(0).max(24),
  awoke_times: z.number().min(0).max(50),
  quality_feeling: z.enum(['cansado', 'normal', 'revigorado']),
}).strict();

// Schema para os detalhes de Evolução (Check-in)
export const evolutionDetailsSchema = z.object({
  photo_url: z.string().url('A foto é obrigatória.'),
  weight_kg: z.number().min(20, 'Peso inválido').max(300, 'Peso inválido'),
}).strict();

// Schema Principal do Log
export const logSchema = z.object({
  category: z.enum(['water', 'sleep', 'poop', 'food', 'workout', 'note', 'jacada', 'evolution']),
  primary_value: z.number().min(0).max(100),
  details: z.record(z.string(), z.unknown()).optional(),
  // event_time is optional; when provided it must not be in the future
  event_time: z
    .string()
    .max(100)
    .datetime({ offset: true, message: 'event_time deve ser uma data ISO válida.' })
    .refine((val) => new Date(val) <= new Date(), {
      message: 'Não é possível registrar eventos em datas futuras.',
    })
    .optional(),
  source: z.string().max(100).optional(),
}).strict();

// Schema para os detalhes da Jacada
export const jacadaSchema = z.object({
  sugar: z.number().min(0).max(5),
  fat: z.number().min(0).max(5),
  alcohol: z.number().min(0).max(5),
  event_time: z
    .string()
    .max(100)
    .datetime({ offset: true, message: 'event_time deve ser uma data ISO válida.' })
    .refine((val) => new Date(val) <= new Date(), {
      message: 'Não é possível registrar eventos em datas futuras.',
    })
    .optional(),
  source: z.string().max(100).optional(),
}).strict();
