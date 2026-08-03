import { NextResponse } from 'next/server';
import { getPlanUsage } from '@/services/planService';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await getPlanUsage(userId);

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching plan usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
