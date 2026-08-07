import { z } from 'zod';

export const pushTokenSchema = z.object({
  onesignal_id: z.string().min(1, 'OneSignal ID é obrigatório'),
});

export type PushTokenPayload = z.infer<typeof pushTokenSchema>;
