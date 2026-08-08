import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function trackEvent(
  eventName: string,
  metadata: Record<string, unknown> | undefined,
  userId: string | null,
) {
  return prisma.systemEvent.create({
    data: {
      eventName,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      userId,
    },
  });
}

export const eventService = { trackEvent };
