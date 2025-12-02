import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Fetching single application...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract IDs from URL
    const url = new URL(req.url);
    console.log('📍 Full URL:', url.pathname);
    
    const pathParts = url.pathname.split('/');
    console.log('📍 Path parts:', pathParts);
    
    // /api/jobs/[jobId]/applications/[appId]
    // [0]='', [1]='api', [2]='jobs', [3]=jobId, [4]='applications', [5]=appId
    const jobId = pathParts[3];
    const appId = pathParts[5];
    
    console.log('📍 Extracted IDs:', { jobId, appId });

    if (!jobId || !appId) {
      return NextResponse.json({ 
        error: 'Missing job ID or application ID',
        details: { jobId, appId }
      }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // First, check if application exists at all
    console.log('🔍 Checking if application exists...');
    const { data: checkApp, error: checkError } = await supabase
      .from('user_job_applications')
      .select('id, job_id')
      .eq('id', appId);
    
    console.log('Check result:', { checkApp, checkError });

    // Fetch single application with user data
    console.log('🔍 Fetching application with user data...');
    const { data: application, error } = await supabase
      .from('user_job_applications')
      .select(`
        *,
        user:user_id (
          name,
          email
        )
      `)
      .eq('id', appId)
      .eq('job_id', jobId)
      .single();

    console.log('📄 Application fetch result:', {
      found: !!application,
      error: error?.message,
      errorCode: error?.code,
      errorDetails: error?.details
    });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ 
        error: 'Application not found',
        details: error.message,
        hint: error.hint
      }, { status: 404 });
    }

    if (!application) {
      return NextResponse.json({ 
        error: 'Application not found',
        jobId,
        appId
      }, { status: 404 });
    }

    console.log('✅ Application found:', application.id);
    return NextResponse.json({ application });

  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}