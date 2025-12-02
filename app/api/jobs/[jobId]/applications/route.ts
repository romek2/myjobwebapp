import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;
    const supabase = createServerSupabase();

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company, location, posted_at')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch applications
    const { data: applications, error: appsError } = await supabase
      .from('user_job_applications')
      .select(`
        *,
        user:user_id (
          name,
          email
        )
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });

    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return NextResponse.json({ 
        error: 'Failed to fetch applications' 
      }, { status: 500 });
    }

    return NextResponse.json({
      job,
      applications: applications || []
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}