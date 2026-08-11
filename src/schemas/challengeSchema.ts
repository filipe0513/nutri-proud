import { z } from 'zod';

export const challengeSchema = z.object({
  goalDescription: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  shareWorkouts: z.boolean().default(false),
  shareMeals: z.boolean().default(false),
  shareWater: z.boolean().default(false),
  weeklyEvolution: z.boolean().default(false),
  dailySummary: z.boolean().default(false),
});

export type ChallengeInput = z.infer<typeof challengeSchema>;
