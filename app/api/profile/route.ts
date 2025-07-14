import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase'; // Using your existing function

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase(); // Your server instance

    // Get user data (subscription status already exists in your User table)
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('subscriptionStatus, name, email, image')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get profile data from new user_profiles table
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    // Get skills from new user_skills table
    const { data: skills = [] } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    // Get latest resume from existing user_resumes table
    const { data: resume } = await supabase
      .from('user_resumes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get job alerts from existing JobAlert table  
    const { data: jobAlerts = [] } = await supabase
      .from('JobAlert')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false });

    const profileData = {
      user: {
        ...user,
        subscriptionStatus: user.subscriptionStatus || 'FREE'
      },
      profile: profile || {
        experience_level: 'mid',
        preferred_location: 'remote',
        job_types: ['Full-time']
      },
      skills,
      resume,
      jobAlerts
    };

    return NextResponse.json({ profile: profileData });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const data = await request.json();
    const { experience_level, preferred_location, salary_min, salary_max, job_types } = data;

    // Upsert profile data
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: session.user.id,
        experience_level,
        preferred_location,
        salary_min,
        salary_max,
        job_types,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}