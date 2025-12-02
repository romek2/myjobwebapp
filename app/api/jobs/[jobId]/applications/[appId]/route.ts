import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching single application...');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract IDs from URL path (same pattern as your company portal)
    const pathname = request.nextUrl.pathname;
    const pathParts = pathname.split('/');
    
    console.log('📍 URL pathname:', pathname);
    console.log('📍 Path parts:', pathParts);
    
    // /api/jobs/[jobId]/applications/[appId]
    // pathParts: ['', 'api', 'jobs', '6074', 'applications', '39']
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

    // Fetch application with user data
    console.log(`🔍 Querying application ${appId} for job ${jobId}...`);
    
    const { data: application, error } = await supabase
      .from('user_job_applications')
      .select('*')
      .eq('id', appId)
      .eq('job_id', jobId)
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ 
        error: 'Application not found',
        details: error.message
      }, { status: 404 });
    }

    if (!application) {
      console.log('❌ No application found');
      return NextResponse.json({ 
        error: 'Application not found'
      }, { status: 404 });
    }

    // Fetch user data separately (more reliable than join)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', application.user_id)
      .single();

    if (userError) {
      console.error('⚠️ User fetch error:', userError);
      // Continue anyway, just without user data
    }

    // Add user data to application
    const applicationWithUser = {
      ...application,
      user: user || { name: 'Unknown', email: 'Unknown' }
    };

    console.log('✅ Successfully loaded application:', applicationWithUser.id);
    
    return NextResponse.json({ application: applicationWithUser });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}