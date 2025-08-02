// app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/services/notificationService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract notification ID from URL
    const pathname = request.nextUrl.pathname;
    const notificationId = pathname.split('/')[3]; // /api/notifications/[id]/read

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Mark notification as read
    const success = await notificationService.markAsRead(notificationId, session.user.id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}