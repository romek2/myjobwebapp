import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Updating application status...');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract IDs from URL path
    const pathname = request.nextUrl.pathname;
    const pathParts = pathname.split('/');
    
    console.log('📍 URL pathname:', pathname);
    console.log('📍 Path parts:', pathParts);
    
    // /api/jobs/[jobId]/applications/[appId]/update
    // pathParts: ['', 'api', 'jobs', '6074', 'applications', '39', 'update']
    const jobId = pathParts[3];
    const appId = pathParts[5];
    
    console.log('📍 Extracted IDs:', { jobId, appId });

    if (!jobId || !appId) {
      return NextResponse.json({ 
        error: 'Missing job ID or application ID' 
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { status, companyNotes, interviewDate, interviewer, location } = body;
    
    console.log('📋 Update data:', {
      status,
      hasNotes: !!companyNotes,
      hasInterview: !!interviewDate
    });

    if (!status) {
      return NextResponse.json({ 
        error: 'Status is required' 
      }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Update application
    const { data, error } = await supabase
      .from('user_job_applications')
      .update({
        status,
        company_notes: companyNotes || null,
        interview_date: interviewDate || null,
        interviewer_name: interviewer || null,
        interview_location: location || null,
      })
      .eq('id', appId)
      .eq('job_id', jobId)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ 
        error: 'Failed to update application',
        details: error.message
      }, { status: 500 });
    }

    if (!data) {
      console.log('❌ No data returned from update');
      return NextResponse.json({ 
        error: 'Application not found' 
      }, { status: 404 });
    }

    console.log('✅ Application updated successfully:', data.id);

    // TODO: Send email notification to candidate here
    // await sendStatusUpdateEmail(data);

    return NextResponse.json({ 
      success: true, 
      application: data 
    });

  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}