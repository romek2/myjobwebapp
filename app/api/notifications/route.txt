// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/services/notificationService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has PRO access
    const isPro = session.user.subscriptionStatus === 'PRO';

    // Get user's notifications with PRO filtering
    const notifications = await notificationService.getUserNotifications(
      session.user.id, 
      isPro
    );

    return NextResponse.json({ 
      notifications,
      isPro,
      count: notifications.length,
      unreadCount: notifications.filter(n => !n.is_read).length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

