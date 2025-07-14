import { NextRequest, NextResponse } from 'next/server';
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

    // Get recent applications
    const { data: applications } = await supabase
      .from('user_job_applications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('applied_at', { ascending: false })
      .limit(10);

    // Get recent views
    const { data: views } = await supabase
      .from('user_job_views')
      .select('*')
      .eq('user_id', session.user.id)
      .order('viewed_at', { ascending: false })
      .limit(20);

    // Get summary stats
    const { count: totalApplications } = await supabase
      .from('user_job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    const { count: totalViews } = await supabase
      .from('user_job_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    return NextResponse.json({
      applications: applications || [],
      views: views || [],
      stats: {
        totalApplications: totalApplications || 0,
        totalViews: totalViews || 0
      }
    });
  } catch (error) {
    console.error('Error fetching job activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}