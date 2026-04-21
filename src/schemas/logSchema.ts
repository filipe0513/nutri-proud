import { z } from 'zod';

// Schema para os detalhes de Comida (JSONB)
export const foodDetailsSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'morning_snack', 'afternoon_snack', 'dessert']),
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
  category: z.enum(['water', 'sleep', 'poop', 'food', 'workout', 'note']),
  primary_value: z.number().min(0).max(100),
  details: z.any(),
});
