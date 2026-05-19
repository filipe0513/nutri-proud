import { z } from 'zod';

export const notificationCategorySchema = z.enum(['REMINDER', 'ACHIEVEMENT', 'SYSTEM', 'ALERT']);

export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  isRead: z.boolean().default(false),
  category: notificationCategorySchema,
  actionType: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;
