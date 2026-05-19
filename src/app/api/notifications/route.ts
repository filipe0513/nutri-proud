import { NextResponse } from 'next/server';
import { getUserNotifications, markAsRead } from '@/services/notificationService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const notifications = await getUserNotifications(userId);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { notificationId, userId } = await request.json();

    if (!notificationId || !userId) {
      return NextResponse.json({ error: 'notificationId and userId are required' }, { status: 400 });
    }

    const updated = await markAsRead(notificationId, userId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
