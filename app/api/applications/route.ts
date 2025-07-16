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
        available_start_date
      `)
      .eq('user_id', session.user.id)
      .order('applied_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ applications: applications || [] });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch applications' 
    }, { status: 500 });
  }
}