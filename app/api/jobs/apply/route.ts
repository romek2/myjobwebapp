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

    const { jobId, jobTitle, company, applicationUrl, location } = await req.json();
    const supabase = createServerSupabase();

    // Record the application
    const { data: application, error } = await supabase
      .from('user_job_applications')
      .insert({
        user_id: session.user.id,
        job_id: jobId,
        job_title: jobTitle,
        company,
        application_url: applicationUrl,
        location,
        status: 'applied'
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking application:', error);
      return NextResponse.json({ error: 'Failed to track application' }, { status: 500 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}