import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Get applications
    const { data: applications } = await supabase
      .from('user_job_applications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('applied_at', { ascending: false });

    // Get view count
    const { count: viewCount } = await supabase
      .from('user_job_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    return NextResponse.json({
      applications: applications || [],
      stats: {
        totalApplications: applications?.length || 0,
        totalViews: viewCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}