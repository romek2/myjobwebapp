import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await req.json();
    const supabase = createServerSupabase();

    // Just track the view
    const { error } = await supabase
      .from('user_job_views')
      .upsert({
        user_id: session.user.id,
        job_id: jobId,
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,job_id'
      });

    if (error) {
      console.error('Error tracking view:', error);
      return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}