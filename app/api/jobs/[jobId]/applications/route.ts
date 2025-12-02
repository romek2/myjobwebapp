import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract jobId from URL (same way as your apply route)
    const url = new URL(req.url);
    const jobId = url.pathname.split('/')[3]; // Gets jobId from /api/jobs/[jobId]/applications
    
    console.log('📍 Fetching applications for job:', jobId);

    const supabase = createServerSupabase();

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company, location, posted_at')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch all applications for this job
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
        error: 'Failed to fetch applications',
        details: appsError.message 
      }, { status: 500 });
    }

    console.log(`✅ Found ${applications?.length || 0} applications for job ${jobId}`);

    return NextResponse.json({
      job,
      applications: applications || []
    });

  } catch (error: any) {
    console.error('💥 Error in applications route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}