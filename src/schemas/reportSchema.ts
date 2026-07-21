import { z } from 'zod';

export const reportQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate deve estar no formato YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate deve estar no formato YYYY-MM-DD'),
}).strict();

export type ReportQuery = z.infer<typeof reportQuerySchema>;
