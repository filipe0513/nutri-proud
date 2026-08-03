import { NextResponse } from 'next/server';
import { getPlanUsage } from '@/services/planService';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    // Basic auth logic to get the current user session
    const sessionToken = cookieStore.get('next-auth.session-token')?.value || cookieStore.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: { userId: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await getPlanUsage(session.userId);

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching plan usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
