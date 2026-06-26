import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { getUserNotifications, markAsRead } from '@/services/notificationService';

async function getUserId(): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const cookieStore = await cookies();
  return cookieStore.get('anon_user_id')?.value;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const notifications = await getUserNotifications(userId);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    const updated = await markAsRead(notificationId, userId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
