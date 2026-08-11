import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: { team: true },
  });

  if (!challenge) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.json(challenge);
}
