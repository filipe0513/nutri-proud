import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;

  let targetUserId = resolvedParams.id;
  let isMe = false;

  if (targetUserId === 'me') {
    if (!currentUserId) {
      redirect('/welcome');
    }
    targetUserId = currentUserId;
    isMe = true;
  } else if (targetUserId === currentUserId) {
    isMe = true;
  }

  // Fetch User
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, image: true },
  });

  if (!user) {
    notFound();
  }

  // Fetch Posts by User
  const rawPosts = await prisma.post.findMany({
    where: { authorId: targetUserId },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, image: true } },
      reactions: true,
      comments: true,
    },
  });

  const posts = rawPosts.map((post) => {
    // Agrupar reações por emoji
    const emojiMap: Record<string, { count: number; reacted: boolean }> = {};
    post.reactions.forEach((r) => {
      if (!emojiMap[r.emoji]) {
        emojiMap[r.emoji] = { count: 0, reacted: false };
      }
      emojiMap[r.emoji].count++;
      if (currentUserId && r.userId === currentUserId) {
        emojiMap[r.emoji].reacted = true;
      }
    });

    return {
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      type: post.type,
      squadId: post.squadId,
      createdAt: post.createdAt.toISOString(),
      authorId: post.authorId,
      author: {
        id: post.author.id,
        name: post.author.name,
        image: post.author.image,
      },
      reactions: Object.entries(emojiMap).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        reacted: data.reacted,
      })),
      commentCount: post.comments.length,
    };
  });

  // Fetch Logs for the current month to calculate daily scores
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: targetUserId,
      eventTime: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      eventTime: true,
      primaryValue: true,
      category: true,
    },
  });

  // Calculate daily average score
  // We'll group logs by YYYY-MM-DD
  const dailySums: Record<string, { total: number; count: number }> = {};

  logs.forEach((log) => {
    // Assuming eventTime is in UTC, we convert to local string YYYY-MM-DD
    // But for simplicity, we can format using JS local time
    const date = new Date(log.eventTime);
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${m}-${d}`;

    if (!dailySums[dateStr]) {
      dailySums[dateStr] = { total: 0, count: 0 };
    }
    dailySums[dateStr].total += log.primaryValue;
    dailySums[dateStr].count++;
  });

  const scoresByDate: Record<string, number> = {};
  for (const [dateStr, data] of Object.entries(dailySums)) {
    scoresByDate[dateStr] = Math.min(100, Math.round(data.total / data.count));
  }

  return (
    <ProfileClient
      user={user}
      scoresByDate={scoresByDate}
      initialPosts={posts}
      isMe={isMe}
    />
  );
}
