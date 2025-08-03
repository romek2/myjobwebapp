// app/api/test/simple-mock-data/route.ts
// Simplified version that works with existing table structure

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const userId = session.user.id;

    // Simple applications with only basic required fields
    const simpleApplications = [
      {
        user_id: userId,
        job_id: 'test-job-1',
        job_title: 'Senior React Developer',
        company: 'TechCorp Inc.',
        status: 'applied',
        applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        cover_letter: 'I am very excited about this opportunity...',
        desired_salary: 85000
      },
      {
        user_id: userId,
        job_id: 'test-job-2',
        job_title: 'Full Stack Engineer', 
        company: 'StartupXYZ',
        status: 'under_review',
        applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        cover_letter: 'Your startup mission aligns perfectly...',
        desired_salary: 75000
      },
      {
        user_id: userId,
        job_id: 'test-job-3',
        job_title: 'Frontend Developer',
        company: 'DesignStudio LLC', 
        status: 'interview',
        applied_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        cover_letter: 'I love creating beautiful user interfaces...',
        desired_salary: 70000
      }
    ];

    // Insert applications
    const { data: applications, error: appError } = await supabase
      .from('user_job_applications')
      .insert(simpleApplications)
      .select();

    if (appError) {
      return NextResponse.json({
        error: 'Failed to create applications',
        details: appError.message,
        code: appError.code,
        hint: appError.hint
      }, { status: 500 });
    }

    // Try to create notifications if table exists
    let notificationsCreated = 0;
    if (applications && applications.length > 0) {
      try {
        const simpleNotifications = [
          {
            user_id: userId,
            application_id: applications[0].id,
            type: 'status_update',
            title: 'Application Received',
            message: 'Your application has been received.',
            is_read: false,
            requires_pro: false
          },
          {
            user_id: userId,
            application_id: applications[1].id,
            type: 'status_update', 
            title: 'Under Review (PRO)',
            message: 'The hiring manager is impressed with your background!',
            is_read: false,
            requires_pro: true
          }
        ];

        const { data: notifications, error: notifError } = await supabase
          .from('user_notifications')
          .insert(simpleNotifications)
          .select();

        if (!notifError) {
          notificationsCreated = notifications?.length || 0;
        }
      } catch (err) {
        console.log('Notifications table might not exist yet');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Simple mock data created successfully!',
      data: {
        applications: applications?.length || 0,
        notifications: notificationsCreated,
        userId: userId
      },
      instructions: [
        '1. Go to /profile to see your applications',
        '2. Check the application tracker component',
        '3. If you want full features, run the SQL migration first'
      ]
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to create simple mock data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Check what exists
    const { data: apps } = await supabase
      .from('user_job_applications')
      .select('*')
      .eq('user_id', session.user.id);

    const { data: notifications } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1);

    return NextResponse.json({
      currentApplications: apps?.length || 0,
      notificationsTableExists: !!notifications,
      userId: session.user.id,
      isPro: session.user.subscriptionStatus === 'PRO'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}