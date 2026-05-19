import { z } from 'zod';

export const ALL_MEALS = [
  { id: 'breakfast',        label: 'Café da manhã' },
  { id: 'morning_snack',    label: 'Lanche da manhã' },
  { id: 'lunch',            label: 'Almoço' },
  { id: 'afternoon_snack',  label: 'Lanche da tarde 1' },
  { id: 'afternoon_snack2', label: 'Lanche da tarde 2' },
  { id: 'dinner',           label: 'Jantar' },
  { id: 'supper',           label: 'Ceia' },
  { id: 'pre_workout',      label: 'Pré-treino' },
  { id: 'post_workout',     label: 'Pós-treino' },
  { id: 'extra_snack',      label: 'Lanche Extra' },
] as const;

export type MealId = (typeof ALL_MEALS)[number]['id'];

export const profileSettingsSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 letras"),
  weight_kg: z.number().min(30, "Peso inválido").max(300, "Peso inválido"),
  height_cm: z.number().min(100, "Altura inválida").max(250, "Altura inválida"),
  goal: z.enum(['fat_loss', 'muscle_gain', 'health']),
  water_target_ml: z.number().min(1000).max(8000),
  sleep_target_hours: z.number().min(4).max(12),
  weekly_workouts: z.number().min(3, 'Mínimo 3 dias').max(7, 'Máximo 7 dias'),
  planned_meals: z
    .array(z.string())
    .min(1, 'Selecione pelo menos 1 refeição')
    .max(10, 'Máximo 10 refeições'),
});

export type ProfileSettingsForm = z.infer<typeof profileSettingsSchema>;
