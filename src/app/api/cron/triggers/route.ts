import { NextResponse } from 'next/server';
import { triggerWaterReminders, triggerJacadaRecovery } from '@/services/notificationService';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Vercel Cron sends a Bearer token
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const [waterResult, jacadaResult] = await Promise.all([
      triggerWaterReminders(),
      triggerJacadaRecovery(),
    ]);

    return NextResponse.json({
      success: true,
      waterRemindersCreated: waterResult.success ? waterResult.count : 0,
      jacadaRemindersCreated: jacadaResult.success ? jacadaResult.count : 0,
    });
  } catch (error) {
    console.error('Error running cron triggers:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
