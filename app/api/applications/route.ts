// app/api/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    const { data: applications, error } = await supabase
      .from('user_job_applications')
      .select(`
        id,
        job_id,
        job_title,
        company,
        status,
        applied_at,
        desired_salary,
        available_start_date,
        cover_letter,
        resume_file_url,
        resume_filename,
        linkedin_url,
        portfolio_url,
        phone,
        created_at
      `)
      .eq('user_id', session.user.id)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch applications',
        details: error.message 
      }, { status: 500 });
    }

    console.log(`Found ${applications?.length || 0} applications for user ${session.user.id}`);

    return NextResponse.json({ 
      applications: applications || [],
      count: applications?.length || 0
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch applications' 
    }, { status: 500 });
  }
}