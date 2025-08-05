// app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract notification ID from URL pathname (matching your pattern)
    const pathname = request.nextUrl.pathname;
    const notificationId = pathname.split('/')[3]; // /api/notifications/[id]/read

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Update notification as read in user_notifications table
    const { data, error } = await supabase
      .from('user_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('user_id', session.user.id) // Ensure user owns the notification
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, notification: data });

  } catch (error) {
    console.error('Error in notification read API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}