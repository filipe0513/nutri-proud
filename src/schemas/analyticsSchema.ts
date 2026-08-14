import { z } from 'zod';

export const dateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;

/**
 * Valid DailyLog category values — matches the `category` field in Prisma's DailyLog model.
 * Source of truth: prisma/schema.prisma + src/schemas/logSchema.ts
 */
export const pillarEnum = z.enum([
  'water',
  'food',
  'sleep',
  'workout',
  'poop',
  'note',
  'jacada',
  'evolution',
]);

export type Pillar = z.infer<typeof pillarEnum>;
