import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { FeedTimeline } from '@/components/shared/FeedTimeline';

export default async function NutriFeedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  // Get teams where user is nutritionist (ADMIN or MEMBER)
  const userTeams = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    select: { teamId: true },
  });
  
  const teamIds = userTeams.map((t) => t.teamId);

  const posts = await prisma.teamFeedPost.findMany({
    where: { teamId: { in: teamIds } },
    orderBy: { createdAt: 'desc' },
    include: {
      patient: {
        select: { id: true, name: true, image: true },
      },
      team: {
        select: { name: true },
      }
    },
    take: 50,
  });

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-title-2 font-bold text-neutral-600">Alertas e Feed</h1>
        <p className="text-body-2 text-neutral-400 mt-1">Acompanhe os alertas e conquistas dos seus pacientes em tempo real.</p>
      </div>

      <FeedTimeline posts={posts} />
    </div>
  );
}
