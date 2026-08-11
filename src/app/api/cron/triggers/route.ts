import { NextResponse } from 'next/server';
import { triggerWaterReminders, triggerJacadaRecovery } from '@/services/notificationService';
import { triggerDailySummaries } from '@/services/dailySummaryService';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Vercel Cron sends a Bearer token
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const [waterResult, jacadaResult, summaryResult] = await Promise.all([
      triggerWaterReminders(),
      triggerJacadaRecovery(),
      triggerDailySummaries(),
    ]);

    return NextResponse.json({
      success: true,
      waterRemindersCreated: waterResult.success ? waterResult.count : 0,
      jacadaRemindersCreated: jacadaResult.success ? jacadaResult.count : 0,
      dailySummariesProcessed: summaryResult.processed,
      dailySummaryErrors: summaryResult.errors,
    });
  } catch (error) {
    console.error('Error running cron triggers:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
