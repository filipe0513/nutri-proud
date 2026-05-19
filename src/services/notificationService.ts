import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@prisma/client';

export async function getUserNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return notifications;
}

export async function markAsRead(notificationId: string, userId: string) {
  return await prisma.notification.update({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function triggerWaterReminders() {
  // Only trigger between 14:00 and 17:00 local time
  // Vercel UTC vs local time might be an issue. Assuming Brazil time for Vercel Cron.
  // Actually, we can check if it's afternoon in Brazil (UTC-3).
  const brazilHour = (new Date().getUTCHours() - 3 + 24) % 24;
  
  if (brazilHour < 14 || brazilHour > 17) {
    return { success: true, message: 'Not in time window for water reminders' };
  }

  // Find users who have a target but haven't reached 50% of it today.
  // This is a simplified logic. We'd fetch users and their logs today.
  
  // For the sake of the MVP, we will fetch users who haven't logged ANY water today
  // Since we don't have a direct "aggregate water today" in Prisma easily across JSONB
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usersWithoutWater = await prisma.user.findMany({
    where: {
      logs: {
        none: {
          category: 'water',
          eventTime: {
            gte: today,
          }
        }
      }
    }
  });

  const createdCount = await Promise.all(
    usersWithoutWater.map(async (user: User) => {
      await prisma.notification.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          title: 'Hora de se hidratar! 💧',
          message: 'Você ainda não registrou água hoje. Que tal beber um copo agora?',
          category: 'REMINDER',
          actionType: 'OPEN_WATER_DRAWER',
        }
      });
    })
  );

  return { success: true, count: createdCount.length };
}

export async function triggerJacadaRecovery() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usersWithJacada = await prisma.user.findMany({
    where: {
      logs: {
        some: {
          category: 'jacada',
          eventTime: {
            gte: yesterday,
            lt: today,
          }
        }
      }
    }
  });

  const createdCount = await Promise.all(
    usersWithJacada.map(async (user: User) => {
      // Check if they already have a recovery notification today to avoid duplicates
      const existing = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          category: 'ACHIEVEMENT', // Maybe SYSTEM or ACHIEVEMENT
          createdAt: {
            gte: today
          }
        }
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            title: 'Novo dia, novo foco! 🎯',
            message: 'Ontem teve uma escapada, mas hoje é um ótimo dia para retomar. Você consegue!',
            category: 'ACHIEVEMENT',
          }
        });
        return 1;
      }
      return 0;
    })
  );

  const total = createdCount.reduce((a: number, b: number) => a + b, 0);
  return { success: true, count: total };
}
