import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { EvolutionClient } from './EvolutionClient';

export const metadata: Metadata = {
  title: 'Evolução | Orgulho da Nutri',
  description: 'Acompanhe sua evolução e registre fotos de check-in semanais.',
};

export default async function EvolutionPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/welcome');
  }

  // Fetch user profile to get current weight
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { profile: true },
  });

  const profile = user?.profile as { weight_kg?: number } | null;
  const currentWeight = profile?.weight_kg || 0;

  // Fetch evolution logs for the history feed
  const evolutionLogs = await prisma.dailyLog.findMany({
    where: {
      userId: session.user.id,
      category: 'evolution',
    },
    orderBy: { eventTime: 'desc' },
  });

  // Convert to plain objects that can be serialized
  const serializedLogs = evolutionLogs.map((log) => ({
    id: log.id,
    event_time: log.eventTime.toISOString(),
    details: log.details as { photo_url: string; weight_kg: number },
  }));

  return (
    <EvolutionClient 
      initialWeight={currentWeight} 
      historyLogs={serializedLogs} 
    />
  );
}
