import { prisma } from '@/lib/prisma';
import { joinTeamByCode } from './teamService';
import type { ChallengeInput } from '@/schemas/challengeSchema';
import type { Challenge, Team } from '@prisma/client';

export type ChallengeWithTeam = Challenge & { team: Team };

/**
 * Creates a new Team + Challenge atomically.
 * The nutriId becomes the team ADMIN.
 */
export async function createChallenge(
  nutriId: string,
  data: ChallengeInput,
): Promise<{ team: Team; challenge: Challenge }> {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name: data.goalDescription,
        members: {
          create: { userId: nutriId, role: 'ADMIN' },
        },
      },
    });

    const challenge = await tx.challenge.create({
      data: {
        teamId: team.id,
        goalDescription: data.goalDescription,
        coverImageUrl: data.coverImageUrl ?? null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        shareWorkouts: data.shareWorkouts,
        shareMeals: data.shareMeals,
        shareWater: data.shareWater,
        weeklyEvolution: data.weeklyEvolution,
        dailySummary: data.dailySummary,
      },
    });

    return { team, challenge };
  });
}

/**
 * Joins a challenge via invite code. Validates endDate BEFORE joining
 * to avoid needing a rollback if the challenge is closed.
 */
export async function joinChallenge(userId: string, inviteCode: string) {
  // Find team and its challenge first (read-only, before any mutation)
  const team = await prisma.team.findUnique({
    where: { inviteCode },
    include: { challenge: true },
  });

  if (!team) {
    throw new Error('Código de convite inválido.');
  }

  if (team.challenge && new Date() > team.challenge.endDate) {
    throw new Error('Desafio encerrado.');
  }

  // Delegate membership creation to existing teamService function
  return joinTeamByCode(userId, inviteCode);
}

/**
 * Returns all challenges where the user is a TeamMember and now is within [startDate, endDate].
 */
export async function getActiveForUser(userId: string): Promise<ChallengeWithTeam[]> {
  const now = new Date();
  return prisma.challenge.findMany({
    where: {
      team: {
        members: { some: { userId } },
      },
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: { team: true },
  });
}

/**
 * Returns all challenges active on a specific date (used for historical summaries).
 */
export async function getActiveForUserOnDate(
  userId: string,
  date: Date,
): Promise<ChallengeWithTeam[]> {
  return prisma.challenge.findMany({
    where: {
      team: {
        members: { some: { userId } },
      },
      startDate: { lte: date },
      endDate: { gte: date },
    },
    include: { team: true },
  });
}
