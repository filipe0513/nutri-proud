import { z } from 'zod';

// Schema para os detalhes de Comida (JSONB)
export const foodDetailsSchema = z.object({
  meal_type: z.enum([
    'breakfast',
    'morning_snack',
    'lunch',
    'afternoon_snack',
    'afternoon_snack2',
    'dinner',
    'supper',
    'pre_workout',
    'post_workout',
    'extra_snack',
    'snack',
    'dessert'
  ]),
  factors: z.object({
    carbs: z.number().min(-50).max(50),
    protein: z.number().min(-50).max(50),
    fats: z.number().min(-50).max(50),
    fiber: z.number().min(-50).max(50),
  }).optional(),
  note: z.string().optional(),
});

// Schema para os detalhes de Sono
export const sleepDetailsSchema = z.object({
  duration_hours: z.number().min(0).max(24),
  awoke_times: z.number().min(0),
  quality_feeling: z.enum(['cansado', 'normal', 'revigorado']),
});

// Schema Principal do Log
export const logSchema = z.object({
  category: z.enum(['water', 'sleep', 'poop', 'food', 'workout', 'note', 'jacada']),
  primary_value: z.number().min(0).max(100),
  details: z.any(),
  // event_time is optional; when provided it must not be in the future
  event_time: z
    .string()
    .datetime({ offset: true, message: 'event_time deve ser uma data ISO válida.' })
    .refine((val) => new Date(val) <= new Date(), {
      message: 'Não é possível registrar eventos em datas futuras.',
    })
    .optional(),
});

// Schema para os detalhes da Jacada
export const jacadaSchema = z.object({
  sugar: z.number().min(0).max(5),
  fat: z.number().min(0).max(5),
  alcohol: z.number().min(0).max(5),
});
