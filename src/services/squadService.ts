import { prisma } from '@/lib/prisma';
import type { PostWithAuthor, ReactionCount, SquadSummary } from '@/types/squadTypes';

// ─── Squads ───────────────────────────────────────────────────────────────────

/**
 * Returns the list of squads the user belongs to, including member count.
 */
export async function getMySquads(userId: string): Promise<SquadSummary[]> {
  const memberships = await prisma.squadMember.findMany({
    where: { userId },
    include: {
      squad: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map(({ squad }) => ({
    id: squad.id,
    name: squad.name,
    description: squad.description,
    inviteCode: squad.inviteCode,
    memberCount: squad._count.members,
    createdAt: squad.createdAt.toISOString(),
  }));
}

/**
 * Creates a new Squad and adds the creator as ADMIN.
 */
export async function createSquad(
  userId: string,
  data: { name: string; description?: string },
): Promise<SquadSummary> {
  const squad = await prisma.squad.create({
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
    id: squad.id,
    name: squad.name,
    description: squad.description,
    inviteCode: squad.inviteCode,
    memberCount: squad._count.members,
    createdAt: squad.createdAt.toISOString(),
  };
}

/**
 * Joins a Squad using an invite code. Throws if code is invalid or user is already a member.
 */
export async function joinSquadByCode(
  userId: string,
  inviteCode: string,
): Promise<SquadSummary> {
  const squad = await prisma.squad.findUnique({
    where: { inviteCode },
    include: { _count: { select: { members: true } } },
  });

  if (!squad) {
    throw new Error('Código de convite inválido.');
  }

  const existing = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId: squad.id, userId } },
  });

  if (existing) {
    throw new Error('Você já é membro deste Squad.');
  }

  await prisma.squadMember.create({
    data: { squadId: squad.id, userId, role: 'MEMBER' },
  });

  return {
    id: squad.id,
    name: squad.name,
    description: squad.description,
    inviteCode: squad.inviteCode,
    memberCount: squad._count.members + 1,
    createdAt: squad.createdAt.toISOString(),
  };
}

/**
 * Gets a squad by ID, ensuring the user is a member.
 */
export async function getSquadById(
  squadId: string,
  userId: string,
): Promise<SquadSummary> {
  const membership = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId } },
    include: {
      squad: {
        include: { _count: { select: { members: true } } },
      },
    },
  });

  if (!membership) {
    throw new Error('Squad não encontrado ou acesso negado.');
  }

  const { squad } = membership;
  return {
    id: squad.id,
    name: squad.name,
    description: squad.description,
    inviteCode: squad.inviteCode,
    memberCount: squad._count.members,
    createdAt: squad.createdAt.toISOString(),
  };
}

/**
 * Updates a squad. Only the ADMIN should be able to do this.
 */
export async function updateSquad(
  squadId: string,
  userId: string,
  data: { name?: string; description?: string },
): Promise<SquadSummary> {
  const membership = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Acesso negado: apenas o administrador pode editar este Squad.');
  }

  const updated = await prisma.squad.update({
    where: { id: squadId },
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
    createdAt: updated.createdAt.toISOString(),
  };
}

/**
 * Deletes a squad. Only the ADMIN should be able to do this.
 */
export async function deleteSquad(
  squadId: string,
  userId: string,
): Promise<void> {
  const membership = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Acesso negado: apenas o administrador pode apagar este Squad.');
  }

  await prisma.squad.delete({ where: { id: squadId } });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

/**
 * Returns the posts in a Squad's feed with reactions and comment counts.
 * Only accessible if the requesting user is a member of the squad.
 */
export async function getSquadPosts(
  squadId: string,
  currentUserId: string,
): Promise<PostWithAuthor[]> {
  // Verify membership
  const membership = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId: currentUserId } },
  });
  if (!membership) throw new Error('Acesso negado: você não é membro deste Squad.');

  const posts = await prisma.post.findMany({
    where: { squadId },
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
      squadId: post.squadId,
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
 * Creates a new post in a Squad. User must be a member.
 */
export async function createSquadPost(
  squadId: string,
  authorId: string,
  data: { content?: string; imageUrl?: string; type?: 'USER_GENERATED' | 'SYSTEM_MILESTONE' },
): Promise<PostWithAuthor> {
  const membership = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId: authorId } },
  });
  if (!membership) throw new Error('Acesso negado: você não é membro deste Squad.');

  const post = await prisma.post.create({
    data: {
      squadId,
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
    squadId: post.squadId,
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
