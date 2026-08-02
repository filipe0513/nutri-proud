import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { UserRole } from '@/types/roles';
import { createTeam } from '@/services/teamService';

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export const userService = {
  async checkUserPermissions(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, is_anonymous: true, createdAt: true, role: true },
    });

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    // Nutricionistas têm acesso irrestrito
    if (user.role === UserRole.NUTRITIONIST) {
      return true;
    }

    // Se for usuário real (não anônimo), acesso liberado
    if (!user.is_anonymous) {
      return true;
    }

    // Validações para Visitante (Anônimo)
    
    // 1. Limite de Tempo (7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (user.createdAt < sevenDaysAgo) {
      throw new PermissionError('Seu período de testes de 7 dias expirou. Crie uma conta grátis para continuar.');
    }

    // 2. Limite de Uso (11 logs)
    const logsCount = await prisma.dailyLog.count({
      where: { userId }
    });

    if (logsCount >= 11) {
      throw new PermissionError('Você atingiu o limite de registros do modo visitante. Crie uma conta grátis para desbloquear.');
    }

    return true;
  },

  async checkHasCompletedOnboarding(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true, role: true },
    });

    if (!user) return false;

    // Nutricionistas não passam pelo onboarding de paciente
    if (user.role === UserRole.NUTRITIONIST) {
      return true;
    }

    const profile = user.profile as Record<string, unknown> | null;
    if (!profile) return false;

    return typeof profile.main_goal === 'string' && profile.main_goal.length > 0;
  },

  async createAnonymousUser() {
    return await prisma.user.create({
      data: {
        is_anonymous: true,
        name: 'Visitante',
        profile: {}, // defaults
        targets: {
            water_ml_per_day: 2000,
            planned_meals: ['breakfast', 'lunch', 'afternoon_snack', 'dinner'],
            sleep_hours_per_night: 8,
            weekly_workouts: 3
        }
      }
    });
  },

  /**
   * Promove um usuário para NUTRITIONIST.
   *
   * Provisionamento automático executado:
   * 1. Role atualizado para 'NUTRITIONIST'
   * 2. Targets de paciente zerados (não se aplicam à nutri)
   * 3. Profile marcado com onboarding_skipped para ignorar o fluxo de paciente
   * 4. Uma Team padrão é criada com a nutri como ADMIN
   * 5. SystemEvent registrado para auditoria
   *
   * Nota: a sessão NextAuth usa database strategy, então o novo role é refletido
   * automaticamente no próximo request (sem precisar de logout).
   */
  async promoteToNutritionist(userId: string): Promise<{ teamInviteCode: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, is_anonymous: true },
    });

    if (!user) throw new Error('Usuário não encontrado.');
    if (user.is_anonymous) throw new Error('Não é possível promover um usuário anônimo.');
    if (user.role === UserRole.NUTRITIONIST) throw new Error('Usuário já é Nutricionista.');
    if (user.role === UserRole.ADMIN) throw new Error('Não é possível alterar a role de um Admin.');

    // 1. Atualiza role e limpa profile de paciente
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: UserRole.NUTRITIONIST,
        targets: Prisma.DbNull,    // Metas de paciente não se aplicam
        profile: { onboarding_skipped: true },
      },
    });

    // 2. Cria a Team padrão da nutri
    const teamName = user.name ? `Team da ${user.name}` : 'Meu Team';
    const team = await createTeam(userId, {
      name: teamName,
      description: 'Team criado automaticamente ao ativar a conta de nutricionista.',
    });

    // 3. Registro de auditoria
    await prisma.systemEvent.create({
      data: {
        userId,
        eventName: 'ROLE_PROMOTED_NUTRITIONIST',
        metadata: {
          promoted_at: new Date().toISOString(),
          default_team_id: team.id,
          default_team_invite_code: team.inviteCode,
        },
      },
    });

    return { teamInviteCode: team.inviteCode };
  },
};
