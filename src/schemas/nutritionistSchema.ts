import { z } from 'zod';

export const nutritionistProfileSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  crn: z.string().max(20).optional(),
  bio: z.string().max(600).optional(),
  city: z.string().max(80).optional(),
  uf: z.string().length(2).optional(),
  whatsapp: z.string().regex(/^\d{10,15}$/).optional(),
  publicEmail: z.string().email().optional(),
  schedulingUrl: z.string().url().optional(),
  plansInfo: z.string().max(400).optional(),
  visibility: z.enum(['HIDDEN', 'APP_ONLY', 'PUBLIC']),
});

export type NutritionistProfileInput = z.infer<typeof nutritionistProfileSchema>;
