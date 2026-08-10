import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@prisma/client';
import { getLocalStartOfDay } from '@/utils/dateUtils';

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

/**
 * Função centralizadora de envio de notificações, respeitando as preferências do usuário.
 */
export async function dispatchNotification(
  userId: string,
  category: string,
  title: string,
  body: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataPayload?: any
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notification_preferences: true, email: true, oneSignalId: true },
  });

  if (!user) return { success: false, error: 'User not found' };

  // Parse preferences safely, falling back to all enabled
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prefsRaw = (user.notification_preferences as Record<string, any>) || {};
  const catPrefs = prefsRaw[category] || { push: true, email: true, in_app: true };

  const results = { in_app: false, email: false, push: false };

  // 1. In-App Bell
  if (catPrefs.in_app !== false) {
    await prisma.notification.create({
      data: {
        id: uuidv4(),
        userId,
        title,
        message: body,
        category,
        actionType: dataPayload?.actionType || null,
      },
    });
    results.in_app = true;
  }

  // 2. Email (Resend stub)
  if (catPrefs.email !== false && user.email) {
    // Stub call for email service
    console.log(`[NotificationService] Sending Email to ${user.email}: ${title} - ${body}`);
    results.email = true;
  }

  // 3. Push (OneSignal)
  if (catPrefs.push !== false && user.oneSignalId) {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (appId && apiKey) {
      try {
        const res = await fetch('https://api.onesignal.com/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${apiKey}`,
          },
          body: JSON.stringify({
            app_id: appId,
            include_player_ids: [user.oneSignalId],
            headings: { en: title },
            contents: { en: body },
            data: dataPayload ?? {},
          }),
        });
        if (res.ok) {
          results.push = true;
        } else {
          console.error(`[NotificationService] OneSignal push failed: ${res.status}`);
        }
      } catch (err) {
        console.error('[NotificationService] OneSignal push error:', err);
      }
    } else {
      console.log(`[NotificationService] OneSignal keys missing, skipping push for ${user.oneSignalId}`);
    }
  }

  return { success: true, dispatched: results };
}

/**
 * Notifies all ADMIN members of a team, respecting mute preferences.
 * Used for patient activity events (posts, reactions, comments, system alerts).
 */
export async function notifyTeamAdmins(
  teamId: string,
  excludeUserId: string,
  category: string,
  title: string,
  body: string,
  dataPayload?: Record<string, unknown>,
): Promise<void> {
  const admins = await prisma.teamMember.findMany({
    where: {
      teamId,
      role: 'ADMIN',
      muteNotifications: { not: true },
      userId: { not: excludeUserId },
    },
    select: { userId: true },
  });

  await Promise.allSettled(
    admins.map((admin) =>
      dispatchNotification(admin.userId, category, title, body, dataPayload),
    ),
  );
}

/**
 * Cria uma notificação persistente para um insight gerado pela IA.
 * Chamada pelo insightService logo após salvar o AiInsight no banco.
 */
export async function createInsightNotification(
  userId: string,
  message: string,
  cta: string | null,
) {
  const ctaLabel = cta ? ` (foco: ${cta})` : '';
  return prisma.notification.create({
    data: {
      id: uuidv4(),
      userId,
      title: 'Nutri tem um insight para você ✨',
      message: message + ctaLabel,
      category: 'INSIGHT',
      actionType: 'OPEN_INSIGHTS_DRAWER',
    },
  });
}

/**
 * Cria uma notificação persistente com a reação da IA à jacada do usuário.
 * Chamada pela rota /api/ai/jacada-reaction após gerar o texto.
 */
export async function createJacadaNotification(userId: string, message: string) {
  return prisma.notification.create({
    data: {
      id: uuidv4(),
      userId,
      title: 'Nutri reagiu à sua jacada 🍔',
      message,
      category: 'SYSTEM',
      actionType: null,
    },
  });
}

export async function triggerWaterReminders() {
  // Only trigger in the evening (around 20:00 local time) for daily summary/reminder
  // Vercel UTC vs local time might be an issue. Assuming Brazil time for Vercel Cron.
  // Actually, we can check if it's evening in Brazil (UTC-3).
  const brazilHour = (new Date().getUTCHours() - 3 + 24) % 24;
  
  if (brazilHour < 19 || brazilHour > 21) {
    return { success: true, message: 'Not in time window for water reminders' };
  }

  // Find users who have a target but haven't reached 50% of it today.
  // This is a simplified logic. We'd fetch users and their logs today.
  
  // For the sake of the MVP, we will fetch users who haven't logged ANY water today
  // Since we don't have a direct "aggregate water today" in Prisma easily across JSONB
  
  const today = getLocalStartOfDay();

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
  const today = getLocalStartOfDay();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

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
