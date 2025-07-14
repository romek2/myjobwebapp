import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  context: { params: { jobId: string } }  // ✅ FIXED: correct typing
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const { job_title, company, application_url } = await request.json();

    // Record the external application
    const { data: application, error } = await supabase
      .from('user_job_applications')
      .insert({
        user_id: session.user.id,
        job_id: context.params.jobId,  // ✅ FIXED: use context.params
        job_title,
        company,
        application_url,
        status: 'applied'
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking job application:', error);
      return NextResponse.json({ error: 'Failed to track application' }, { status: 500 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error tracking job application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// app/api/profile/activity/route.ts - Get user's job activity
