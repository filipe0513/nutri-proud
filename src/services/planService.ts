import { prisma } from '@/lib/prisma';
import { Plan } from '@prisma/client';

export const PLAN_LIMITS = {
  FREE: { groups: 1, patients: 5 },
  START: { groups: 5, patients: 15 },
  PRO: { groups: Infinity, patients: Infinity },
};

export async function canCreateGroup(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) return false;

  const limit = PLAN_LIMITS[user.plan].groups;
  if (limit === Infinity) return true;

  const groupCount = await prisma.teamMember.count({
    where: {
      userId,
      role: 'ADMIN',
    },
  });

  return groupCount < limit;
}

export async function canInvitePatient(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) return false;

  const limit = PLAN_LIMITS[user.plan].patients;
  if (limit === Infinity) return true;

  // Conta quantos membros o usuário (como ADMIN) possui em seus grupos.
  // Como um paciente está ligado a um Team e o Nutricionista é ADMIN do Team,
  // pegamos todos os Teams onde o userId é ADMIN.
  const myTeams = await prisma.teamMember.findMany({
    where: {
      userId,
      role: 'ADMIN',
    },
    select: {
      teamId: true,
    },
  });

  const teamIds = myTeams.map((m) => m.teamId);

  if (teamIds.length === 0) return true; // Se não tem grupo, teoricamente não tem paciente, então count = 0

  // Contar quantos membros existem nesses times que não são o próprio ADMIN
  const patientsCount = await prisma.teamMember.count({
    where: {
      teamId: { in: teamIds },
      role: 'MEMBER',
    },
  });

  return patientsCount < limit;
}

export async function getPlanUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    return {
      plan: 'FREE' as Plan,
      groups: { current: 0, limit: PLAN_LIMITS.FREE.groups },
      patients: { current: 0, limit: PLAN_LIMITS.FREE.patients },
    };
  }

  const myTeams = await prisma.teamMember.findMany({
    where: {
      userId,
      role: 'ADMIN',
    },
    select: {
      teamId: true,
    },
  });

  const groupCount = myTeams.length;
  const teamIds = myTeams.map((m) => m.teamId);

  const patientsCount = teamIds.length > 0 
    ? await prisma.teamMember.count({
        where: {
          teamId: { in: teamIds },
          role: 'MEMBER',
        },
      })
    : 0;

  return {
    plan: user.plan,
    groups: { current: groupCount, limit: PLAN_LIMITS[user.plan].groups },
    patients: { current: patientsCount, limit: PLAN_LIMITS[user.plan].patients },
  };
}
