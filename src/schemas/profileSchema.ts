import { z } from 'zod';

export const profileSettingsSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 letras"),
  weight_kg: z.number().min(30, "Peso inválido").max(300, "Peso inválido"),
  height_cm: z.number().min(100, "Altura inválida").max(250, "Altura inválida"),
  goal: z.enum(['fat_loss', 'muscle_gain', 'health']),
  water_target_ml: z.number().min(1000).max(8000),
  sleep_target_hours: z.number().min(4).max(12),
});

export type ProfileSettingsForm = z.infer<typeof profileSettingsSchema>;
