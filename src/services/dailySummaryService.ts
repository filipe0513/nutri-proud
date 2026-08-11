import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getActiveForUserOnDate } from './challengeService';

/**
 * Generates a CHALLENGE_SUMMARY TeamFeedPost for a given user and date.
 * Called fire-and-forget on the first log of the day (for yesterday).
 * Also called by the cron job for users with zero logs that day.
 *
 * Uses create + catch(P2002) instead of findFirst+create to avoid race conditions.
 */
export async function generateForUser(userId: string, date: Date): Promise<void> {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const activeChallenges = await getActiveForUserOnDate(userId, date);
  const dailySummaryChallenges = activeChallenges.filter((c) => c.dailySummary);

  if (dailySummaryChallenges.length === 0) return;

  // Aggregate logs for the day by category
  const logs = await prisma.dailyLog.findMany({
    where: {
      userId,
      eventTime: { gte: dayStart, lte: dayEnd },
    },
    select: { category: true, primaryValue: true },
  });

  const pillars: Record<string, number> = {};
  for (const log of logs) {
    const cat = log.category;
    pillars[cat] = (pillars[cat] ?? 0) + log.primaryValue;
  }

  const totalEntries = logs.length;
  const categories = Object.keys(pillars);
  const content = totalEntries === 0
    ? 'Sem registros neste dia.'
    : `${totalEntries} registro${totalEntries > 1 ? 's' : ''}: ${categories.join(', ')}`;

  for (const challenge of dailySummaryChallenges) {
    try {
      await prisma.teamFeedPost.create({
        data: {
          teamId: challenge.teamId,
          patientId: userId,
          type: 'CHALLENGE_SUMMARY',
          challengeId: challenge.id,
          summaryDate: dayStart,
          content,
          metadata: { pillars },
        },
      });
    } catch (err) {
      // P2002 = unique constraint violation — summary already exists, skip silently
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        continue;
      }
      console.error(`[dailySummaryService] Error generating summary for user=${userId} challenge=${challenge.id}:`, err);
    }
  }
}

/**
 * Runs the daily summary cron for all active challenges with dailySummary=true.
 * For each challenge, generates summaries for members who have not yet received one today.
 */
export async function triggerDailySummaries(): Promise<{ processed: number; errors: number }> {
  const yesterday = new Date(Date.now() - 86_400_000);

  const activeChallenges = await prisma.challenge.findMany({
    where: {
      dailySummary: true,
      startDate: { lte: yesterday },
      endDate: { gte: yesterday },
    },
    include: {
      team: {
        include: { members: { select: { userId: true } } },
      },
    },
  });

  let processed = 0;
  let errors = 0;

  for (const challenge of activeChallenges) {
    for (const member of challenge.team.members) {
      try {
        await generateForUser(member.userId, yesterday);
        processed++;
      } catch (err) {
        console.error(`[dailySummaryService] Cron error for user=${member.userId}:`, err);
        errors++;
      }
    }
  }

  return { processed, errors };
}
