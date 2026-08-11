import { prisma } from '@/lib/prisma';
import { FeedPostType } from '@prisma/client';
import { UserRole } from '@/types/roles';
import type {
  PostWithAuthor,
  ReactionCount,
  TeamSummary,
  TeamWithMembers,
  CommentWithAuthor,
  UnifiedFeedItem,
  PatientRadarData,
  PatientRadarItem,
} from '@/types/teamTypes';
import { dispatchNotification, notifyTeamAdmins } from './notificationService';

// ─── Teams ───────────────────────────────────────────────────────────────────

/**
 * Returns the list of teams the user belongs to, including member count.
 */
export async function getMyTeams(userId: string): Promise<TeamSummary[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map(({ team }) => ({
    id: team.id,
    name: team.name,
    description: team.description,
    inviteCode: team.inviteCode,
    memberCount: team._count.members,
    createdAt: team.createdAt.toISOString(),
  }));
}

/**
 * Returns the teams for the dashboard, with auto-seed for ADMIN users.
 *
 * Business rule: If the requesting user has role ADMIN and has zero teams,
 * a "Meu Consultório (Admin)" team is created atomically, and the admin is
 * registered as both the team ADMIN **and** as a MEMBER patient, so they
 * immediately see their own health data in the B2B view (dogfooding).
 */
export async function getDashboardTeams(
  userId: string,
  userRole: string,
): Promise<TeamSummary[]> {
  const teams = await getMyTeams(userId);

  // Only auto-seed for ADMIN users with no teams
  if (userRole !== UserRole.ADMIN || teams.length > 0) {
    return teams;
  }

  // ── Auto-seed: create "Meu Consultório (Admin)" ──────────────────────────
  //
  // Creates the team and adds the admin as the sole ADMIN member in a single
  // atomic transaction. The admin's own membership (role: ADMIN) is enough —
  // the patient-listing query will include the owner's logs because we no
  // longer exclude the owner from the member list in NutriDashboard.
  await prisma.$transaction(async (tx) => {
    await tx.team.create({
      data: {
        name: 'Meu Consultório (Admin)',
        description:
          'Time de dogfooding automático. Você é o dono e também o primeiro paciente.',
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
    });
  });

  // Re-fetch so the returned list reflects the newly created team
  return getMyTeams(userId);
}

/**
 * Creates a new Team and adds the creator as ADMIN.
 */
export async function createTeam(
  userId: string,
  data: { name: string; description?: string; inviteCode?: string },
): Promise<TeamSummary> {
  let customCode: string | undefined;

  if (data.inviteCode) {
    customCode = data.inviteCode.toUpperCase();
    const existing = await prisma.team.findFirst({
      where: { inviteCode: { equals: customCode, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) {
      throw new Error('Código já em uso. Escolha outro.');
    }
  }

  const team = await prisma.team.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      ...(customCode !== undefined ? { inviteCode: customCode } : {}),
      members: {
        create: { userId, role: 'ADMIN' },
      },
    },
    include: {
      _count: { select: { members: true } },
    },
  });

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    inviteCode: team.inviteCode,
    memberCount: team._count.members,
    createdAt: team.createdAt.toISOString(),
  };
}

/**
 * Joins a Team using an invite code. Throws if code is invalid or user is already a member.
 */
export async function joinTeamByCode(
  userId: string,
  inviteCode: string,
): Promise<TeamSummary> {
  // Case-insensitive lookup: handles both legacy UUID codes and custom alphanumeric codes.
  const team = await prisma.team.findFirst({
    where: { inviteCode: { equals: inviteCode, mode: 'insensitive' } },
    include: { _count: { select: { members: true } } },
  });

  if (!team) {
    throw new Error('Código de convite inválido.');
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: team.id, userId } },
  });

  if (existing) {
    throw new Error('Você já é membro deste Team.');
  }

  await prisma.teamMember.create({
    data: { teamId: team.id, userId, role: 'MEMBER' },
  });

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    inviteCode: team.inviteCode,
    memberCount: team._count.members + 1,
    createdAt: team.createdAt.toISOString(),
  };
}

/**
 * Gets a team by ID, ensuring the user is a member.
 */
export async function getTeamById(
  teamId: string,
  userId: string,
): Promise<TeamSummary> {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    include: {
      team: {
        include: { _count: { select: { members: true } } },
      },
    },
  });

  if (!membership) {
    throw new Error('Team não encontrado ou acesso negado.');
  }

  const { team } = membership;
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    inviteCode: team.inviteCode,
    memberCount: team._count.members,
    currentUserRole: membership.role,
    createdAt: team.createdAt.toISOString(),
  };
}

/**
 * Updates a team. Only the ADMIN should be able to do this.
 */
export async function updateTeam(
  teamId: string,
  userId: string,
  data: { name?: string; description?: string },
): Promise<TeamSummary> {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Acesso negado: apenas o administrador pode editar este Team.');
  }

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
    include: { _count: { select: { members: true } } },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    inviteCode: updated.inviteCode,
    memberCount: updated._count.members,
    currentUserRole: 'ADMIN',
    createdAt: updated.createdAt.toISOString(),
  };
}

/**
 * Deletes a team. Only the ADMIN should be able to do this.
 */
export async function deleteTeam(
  teamId: string,
  userId: string,
): Promise<void> {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Acesso negado: apenas o administrador pode apagar este Team.');
  }

  await prisma.team.delete({ where: { id: teamId } });
}

/**
 * Returns a team with its full members list. Only accessible by the team ADMIN.
 */
export async function getTeamWithMembers(
  teamId: string,
  adminUserId: string,
): Promise<TeamWithMembers> {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: adminUserId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Acesso negado: apenas o administrador pode ver os membros deste Time.');
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      _count: { select: { members: true } },
      members: {
        include: {
          user: { select: { name: true, image: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!team) throw new Error('Time não encontrado.');

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    inviteCode: team.inviteCode,
    memberCount: team._count.members,
    currentUserRole: 'ADMIN',
    createdAt: team.createdAt.toISOString(),
    members: team.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role as 'ADMIN' | 'MEMBER',
      joinedAt: m.joinedAt.toISOString(),
      user: {
        name: m.user.name,
        image: m.user.image,
      },
    })),
  };
}

/**
 * Removes a member from a team. Only the ADMIN can call this; self-removal is forbidden.
 */
export async function removeTeamMember(
  teamId: string,
  adminUserId: string,
  memberUserId: string,
): Promise<void> {
  const adminMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: adminUserId } },
  });

  if (!adminMembership || adminMembership.role !== 'ADMIN') {
    throw new Error('Acesso negado: apenas o administrador pode remover membros.');
  }

  if (adminUserId === memberUserId) {
    throw new Error('Você não pode remover a si mesmo do Time.');
  }

  const targetMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: memberUserId } },
  });

  if (!targetMember) {
    throw new Error('Membro não encontrado neste Time.');
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId: memberUserId } },
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

/**
 * Returns the posts in a Team's feed with reactions and comment counts.
 * Only accessible if the requesting user is a member of the team.
 */
export async function getTeamPosts(
  teamId: string,
  currentUserId: string,
): Promise<PostWithAuthor[]> {
  // Verify membership
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: currentUserId } },
  });
  if (!membership) throw new Error('Acesso negado: você não é membro deste Team.');

  const posts = await prisma.post.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      author: { select: { id: true, name: true, image: true } },
      reactions: true,
      _count: { select: { comments: true } },
    },
  });

  return posts.map((post) => {
    // Aggregate reactions by emoji
    const emojiMap = new Map<string, { count: number; reacted: boolean }>();
    for (const r of post.reactions) {
      const existing = emojiMap.get(r.emoji) ?? { count: 0, reacted: false };
      emojiMap.set(r.emoji, {
        count: existing.count + 1,
        reacted: existing.reacted || r.userId === currentUserId,
      });
    }
    const reactions: ReactionCount[] = Array.from(emojiMap.entries()).map(
      ([emoji, { count, reacted }]) => ({ emoji, count, reacted }),
    );

    return {
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      type: post.type,
      teamId: post.teamId,
      author: {
        id: post.author.id,
        name: post.author.name,
        image: post.author.image,
      },
      reactions,
      commentCount: post._count.comments,
      createdAt: post.createdAt.toISOString(),
    };
  });
}

/**
 * Creates a new post in a Team. User must be a member.
 */
export async function createTeamPost(
  teamId: string,
  authorId: string,
  data: { content?: string; imageUrl?: string; type?: 'USER_GENERATED' | 'SYSTEM_MILESTONE' },
): Promise<PostWithAuthor> {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: authorId } },
  });
  if (!membership) throw new Error('Acesso negado: você não é membro deste Team.');

  const post = await prisma.post.create({
    data: {
      teamId,
      authorId,
      content: data.content ?? null,
      imageUrl: data.imageUrl ?? null,
      type: data.type ?? 'USER_GENERATED',
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      reactions: true,
      _count: { select: { comments: true } },
    },
  });

  // Notify team admins about new patient post (fire-and-forget)
  notifyTeamAdmins(
    teamId,
    authorId,
    'TEAM_POST',
    `${post.author.name ?? 'Paciente'} publicou no time`,
    data.content ?? 'Nova publicação no time.',
    { actionType: 'OPEN_DASHBOARD_FEED' },
  ).catch(() => {});

  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    type: post.type,
    teamId: post.teamId,
    author: {
      id: post.author.id,
      name: post.author.name,
      image: post.author.image,
    },
    reactions: [],
    commentCount: 0,
    createdAt: post.createdAt.toISOString(),
  };
}

/**
 * Returns a single post by ID. The requesting user must be a member of the post's team.
 */
export async function getPostById(
  postId: string,
  currentUserId: string,
): Promise<PostWithAuthor> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, image: true } },
      reactions: true,
      _count: { select: { comments: true } },
    },
  });

  if (!post) throw new Error('Post não encontrado.');

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: post.teamId, userId: currentUserId } },
  });
  if (!membership) throw new Error('Acesso negado.');

  const emojiMap = new Map<string, { count: number; reacted: boolean }>();
  for (const r of post.reactions) {
    const existing = emojiMap.get(r.emoji) ?? { count: 0, reacted: false };
    emojiMap.set(r.emoji, {
      count: existing.count + 1,
      reacted: existing.reacted || r.userId === currentUserId,
    });
  }
  const reactions: ReactionCount[] = Array.from(emojiMap.entries()).map(
    ([emoji, { count, reacted }]) => ({ emoji, count, reacted }),
  );

  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    type: post.type,
    teamId: post.teamId,
    author: { id: post.author.id, name: post.author.name, image: post.author.image },
    reactions,
    commentCount: post._count.comments,
    createdAt: post.createdAt.toISOString(),
  };
}

/**
 * Deletes a post. Only the author can delete their own post.
 * Throws an error if the post does not exist or the user is not the author.
 */
export async function deletePost(postId: string, userId: string): Promise<void> {
  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    throw new Error('Post não encontrado.');
  }

  if (post.authorId !== userId) {
    throw new Error('Acesso negado: apenas o autor pode apagar este post.');
  }

  await prisma.post.delete({ where: { id: postId } });
}

// ─── Reactions ────────────────────────────────────────────────────────────────

/**
 * Toggles a reaction on a post (adds if not present, removes if already added).
 */
export async function togglePostReaction(
  postId: string,
  userId: string,
  emoji: string,
): Promise<void> {
  const existing = await prisma.reaction.findUnique({
    where: { postId_userId_emoji: { postId, userId, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { postId, userId, emoji } });

    // Notify team admins on new reaction (fire-and-forget)
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { teamId: true } });
    if (post) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      notifyTeamAdmins(
        post.teamId,
        userId,
        'TEAM_REACTION',
        `${user?.name ?? 'Paciente'} reagiu ${emoji}`,
        'Nova reação em um post do time.',
        { actionType: 'OPEN_DASHBOARD_FEED' },
      ).catch(() => {});
    }
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getPostComments(
  postId: string,
  currentUserId: string,
): Promise<CommentWithAuthor[]> {
  // Verify user is a member of the team the post belongs to
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { teamId: true },
  });
  if (!post) throw new Error('Post nao encontrado.');

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: post.teamId, userId: currentUserId } },
  });
  if (!membership) throw new Error('Acesso negado.');

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return comments.map((c) => ({
    id: c.id,
    text: c.text,
    author: { id: c.user.id, name: c.user.name, image: c.user.image },
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function createComment(
  postId: string,
  userId: string,
  text: string,
): Promise<CommentWithAuthor> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { teamId: true, authorId: true },
  });
  if (!post) throw new Error('Post nao encontrado.');

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: post.teamId, userId } },
  });
  if (!membership) throw new Error('Acesso negado.');

  const comment = await prisma.comment.create({
    data: { postId, userId, text },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  // Notify the post author if the commenter is a NUTRITIONIST/ADMIN and not the post author
  if (
    userId !== post.authorId &&
    (membership.role === 'ADMIN')
  ) {
    const commenterName = comment.user.name ?? 'Sua nutri';
    dispatchNotification(
      post.authorId,
      'SYSTEM',
      `${commenterName} comentou no seu post`,
      text,
      { actionType: 'OPEN_TEAM_POST' },
    ).catch(() => {/* silent */});
  }

  // Notify team admins when a patient comments (fire-and-forget)
  if (membership.role !== 'ADMIN') {
    notifyTeamAdmins(
      post.teamId,
      userId,
      'TEAM_COMMENT',
      `${comment.user.name ?? 'Paciente'} comentou`,
      text,
      { actionType: 'OPEN_DASHBOARD_FEED' },
    ).catch(() => {});
  }

  return {
    id: comment.id,
    text: comment.text,
    author: { id: comment.user.id, name: comment.user.name, image: comment.user.image },
    createdAt: comment.createdAt.toISOString(),
  };
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error('Comentario nao encontrado.');
  if (comment.userId !== userId) throw new Error('Acesso negado: apenas o autor pode apagar.');
  await prisma.comment.delete({ where: { id: commentId } });
}

// ─── Unified Feed (Nutri Dashboard) ──────────────────────────────────────────

/**
 * Aggregates `Post` (social) + `TeamFeedPost` (system) into a unified feed
 * for the nutritionist dashboard.
 */
export async function getNutriFeed(
  nutriUserId: string,
  filters?: { types?: string[] },
): Promise<UnifiedFeedItem[]> {
  // 1. Get teams where the nutri is ADMIN
  const adminMemberships = await prisma.teamMember.findMany({
    where: { userId: nutriUserId, role: 'ADMIN' },
    select: { teamId: true, team: { select: { name: true } } },
  });
  const teamIds = adminMemberships.map((m) => m.teamId);
  const teamNameMap = new Map(adminMemberships.map((m) => [m.teamId, m.team.name]));

  if (teamIds.length === 0) return [];

  const wantSocial = !filters?.types || filters.types.includes('social');
  const systemTypes = (filters?.types?.filter((t) => t !== 'social') ?? []) as FeedPostType[];
  const wantSystem = !filters?.types || systemTypes.length > 0;

  const items: UnifiedFeedItem[] = [];

  // 2. Social posts
  if (wantSocial) {
    const posts = await prisma.post.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { id: true, name: true, image: true } },
        reactions: true,
        _count: { select: { comments: true } },
      },
    });

    for (const post of posts) {
      const emojiMap = new Map<string, { count: number; reacted: boolean }>();
      for (const r of post.reactions) {
        const existing = emojiMap.get(r.emoji) ?? { count: 0, reacted: false };
        emojiMap.set(r.emoji, {
          count: existing.count + 1,
          reacted: existing.reacted || r.userId === nutriUserId,
        });
      }
      const reactions: ReactionCount[] = Array.from(emojiMap.entries()).map(
        ([emoji, { count, reacted }]) => ({ emoji, count, reacted }),
      );

      items.push({
        kind: 'social',
        teamName: teamNameMap.get(post.teamId) ?? '',
        post: {
          id: post.id,
          content: post.content,
          imageUrl: post.imageUrl,
          type: post.type,
          teamId: post.teamId,
          author: { id: post.author.id, name: post.author.name, image: post.author.image },
          reactions,
          commentCount: post._count.comments,
          createdAt: post.createdAt.toISOString(),
        },
      });
    }
  }

  // 3. System feed posts
  if (wantSystem) {
    const whereSystem = systemTypes.length > 0
      ? { teamId: { in: teamIds }, type: { in: systemTypes } }
      : { teamId: { in: teamIds } };

    const feedPosts = await prisma.teamFeedPost.findMany({
      where: whereSystem,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        patient: { select: { id: true, name: true, image: true } },
      },
    });

    for (const fp of feedPosts) {
      items.push({
        kind: 'system',
        feedPost: {
          id: fp.id,
          type: fp.type,
          content: fp.content,
          createdAt: fp.createdAt.toISOString(),
          patient: { id: fp.patient.id, name: fp.patient.name, image: fp.patient.image },
          teamName: teamNameMap.get(fp.teamId) ?? '',
          metadata: fp.metadata as import('@/types/teamTypes').EvolutionMetadata | import('@/types/teamTypes').MilestoneMetadata | null,
        },
      });
    }
  }

  // 4. Sort by createdAt desc, take 50
  items.sort((a, b) => {
    const dateA = a.kind === 'social' ? a.post.createdAt : a.feedPost.createdAt;
    const dateB = b.kind === 'social' ? b.post.createdAt : b.feedPost.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return items.slice(0, 50);
}

// ─── Patient Radar ───────────────────────────────────────────────────────────

export async function getPatientRadar(nutriUserId: string): Promise<PatientRadarData> {
  // Get teams where the nutri is ADMIN
  const adminMemberships = await prisma.teamMember.findMany({
    where: { userId: nutriUserId, role: 'ADMIN' },
    select: { teamId: true, team: { select: { name: true } } },
  });
  const teamIds = adminMemberships.map((m) => m.teamId);
  const teamNameMap = new Map(adminMemberships.map((m) => [m.teamId, m.team.name]));

  if (teamIds.length === 0) return { atRisk: [], doingGreat: [] };

  // Get all members in those teams (including the nutri themselves for self-nutri mode)
  const members = await prisma.teamMember.findMany({
    where: { teamId: { in: teamIds } },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  // Deduplicate patients across teams
  const seen = new Set<string>();
  const patients: { user: { id: string; name: string | null; image: string | null }; teamId: string }[] = [];
  for (const m of members) {
    if (!seen.has(m.user.id)) {
      seen.add(m.user.id);
      patients.push({ user: m.user, teamId: m.teamId });
    }
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const atRisk: PatientRadarItem[] = [];
  const doingGreat: PatientRadarItem[] = [];

  for (const p of patients) {
    // Last log
    const lastLog = await prisma.dailyLog.findFirst({
      where: { userId: p.user.id },
      orderBy: { eventTime: 'desc' },
      take: 1,
    });

    const daysSinceLastLog = lastLog
      ? Math.floor((Date.now() - new Date(lastLog.eventTime).getTime()) / 86_400_000)
      : null;

    // Average primaryValue in last 7 days
    const recentLogs = await prisma.dailyLog.findMany({
      where: { userId: p.user.id, eventTime: { gte: sevenDaysAgo } },
      select: { primaryValue: true },
    });

    const recentAvgScore =
      recentLogs.length > 0
        ? Math.round(recentLogs.reduce((sum, l) => sum + l.primaryValue, 0) / recentLogs.length)
        : null;

    const item: PatientRadarItem = {
      patient: { id: p.user.id, name: p.user.name, image: p.user.image },
      teamName: teamNameMap.get(p.teamId) ?? '',
      lastLogAt: lastLog ? lastLog.eventTime.toISOString() : null,
      daysSinceLastLog,
      recentAvgScore,
      status: 'normal',
    };

    if (daysSinceLastLog === null || daysSinceLastLog >= 2 || (recentAvgScore !== null && recentAvgScore < 40)) {
      item.status = 'at_risk';
      atRisk.push(item);
    } else if (recentAvgScore !== null && recentAvgScore >= 80) {
      item.status = 'doing_great';
      doingGreat.push(item);
    }
  }

  return { atRisk, doingGreat };
}

// ─── Active Today Count ──────────────────────────────────────────────────────

/**
 * Counts how many patients (MEMBER role) in the nutri's teams have logged at least
 * one entry today.
 */
export async function getActiveTodayCount(nutriUserId: string): Promise<number> {
  const adminMemberships = await prisma.teamMember.findMany({
    where: { userId: nutriUserId, role: 'ADMIN' },
    select: { teamId: true },
  });
  const teamIds = adminMemberships.map((m) => m.teamId);
  if (teamIds.length === 0) return 0;

  const members = await prisma.teamMember.findMany({
    where: { teamId: { in: teamIds } },
    select: { userId: true },
  });

  const uniquePatientIds = [...new Set(members.map((m) => m.userId))];
  if (uniquePatientIds.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activePatients = await prisma.dailyLog.groupBy({
    by: ['userId'],
    where: {
      userId: { in: uniquePatientIds },
      eventTime: { gte: today },
    },
  });

  return activePatients.length;
}
