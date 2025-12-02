import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Check authentication (optional - remove if you want it open)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      company,
      location,
      description,
      salary,
      employer_email,
      job_type,
      experience_level,
    } = body;

    // Validate required fields
    if (!title || !company || !location || !description || !employer_email) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Insert job into database
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        title,
        company,
        location,
        description,
        salary: salary || null,
        employer_email,
        job_type: job_type || 'Full-time',
        experience_level: experience_level || 'Mid',
        application_type: 'internal', // KEY: Make it internal
        source: 'internal',
        posted_at: new Date().toISOString(),
        url: null, // No external URL
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to create job',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Job created:', job.id);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Job posted successfully'
    });

  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}