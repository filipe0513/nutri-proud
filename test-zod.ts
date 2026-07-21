import { z } from "zod";

export const logSchema = z.object({
  category: z.enum(['water', 'sleep', 'poop', 'food', 'workout', 'note', 'jacada']),
  primary_value: z.number().min(0).max(100),
  details: z.record(z.string(), z.unknown()).optional(),
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

const logData = {
  event_time: "2026-07-21T11:42:00.000-03:00",
  category: "water",
  primary_value: 100,
  details: { quantity_ml: 250 },
  source: "STORIES"
};

try {
  logSchema.parse(logData);
  console.log("Success");
} catch (e) {
  console.dir(e, { depth: null });
}
