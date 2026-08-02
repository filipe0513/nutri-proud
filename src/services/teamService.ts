import { prisma } from '@/lib/prisma';
import type { PostWithAuthor, ReactionCount, TeamSummary } from '@/types/teamTypes';

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
 * Creates a new Team and adds the creator as ADMIN.
 */
export async function createTeam(
  userId: string,
  data: { name: string; description?: string },
): Promise<TeamSummary> {
  const team = await prisma.team.create({
    data: {
      name: data.name,
      description: data.description ?? null,
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
  const team = await prisma.team.findUnique({
    where: { inviteCode },
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
  }
}
