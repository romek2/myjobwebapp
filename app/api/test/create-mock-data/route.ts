// app/api/test/create-mock-data/route.ts
// Create this API route to generate test applications and notifications

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const userId = session.user.id;

    console.log('Creating mock data for user:', userId);

    // 1. Create some test job applications
    const mockApplications = [
      {
        user_id: userId,
        job_id: 'test-job-1',
        job_title: 'Senior React Developer',
        company: 'TechCorp Inc.',
        status: 'applied',
        applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        cover_letter: 'I am very excited about this opportunity to join your team...',
        desired_salary: 85000,
        phone: '+1-555-123-4567',
        linkedin_url: 'https://linkedin.com/in/johndoe'
      },
      {
        user_id: userId,
        job_id: 'test-job-2', 
        job_title: 'Full Stack Engineer',
        company: 'StartupXYZ',
        status: 'under_review',
        applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status_updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        cover_letter: 'Your startup mission aligns perfectly with my values...',
        desired_salary: 75000,
        phone: '+1-555-987-6543'
      },
      {
        user_id: userId,
        job_id: 'test-job-3',
        job_title: 'Frontend Developer',
        company: 'DesignStudio LLC',
        status: 'interview',
        applied_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        status_updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        cover_letter: 'I love creating beautiful user interfaces...',
        desired_salary: 70000,
        interview_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        interviewer_name: 'Sarah Johnson',
        interview_location: 'Zoom call',
        company_notes: 'Great portfolio! Looking forward to our chat.'
      }
    ];

    // Insert applications
    const { data: applications, error: appError } = await supabase
      .from('user_job_applications')
      .insert(mockApplications)
      .select();

    if (appError) {
      console.error('Error creating applications:', appError);
      return NextResponse.json({ 
        error: 'Failed to create applications', 
        details: appError.message 
      }, { status: 500 });
    }

    console.log('Created applications:', applications?.length);

    // 2. Create test notifications (some blurred for FREE users)
    const mockNotifications = applications ? [
      // Regular notification (visible to all users)
      {
        user_id: userId,
        application_id: applications[0].id,
        type: 'status_update',
        title: 'Application Received',
        message: 'Your application for Senior React Developer has been received and is under review.',
        is_read: false,
        requires_pro: false,
        metadata: {
          status: 'applied',
          company: 'TechCorp Inc.'
        }
      },
      // PRO notification (blurred for FREE users)
      {
        user_id: userId,
        application_id: applications[1].id,
        type: 'status_update',
        title: 'Application Under Review',
        message: 'Great news! The hiring manager at StartupXYZ is impressed with your background and wants to move forward. They mentioned your React experience is exactly what they need.',
        is_read: false,
        requires_pro: true,
        metadata: {
          status: 'under_review',
          company: 'StartupXYZ',
          hiring_manager: 'John Smith'
        }
      },
      // Interview notification (PRO feature)
      {
        user_id: userId,
        application_id: applications[2].id,
        type: 'interview_scheduled',
        title: 'Interview Scheduled!',
        message: 'Congratulations! DesignStudio LLC would like to schedule an interview with you. The hiring manager Sarah Johnson is excited to discuss your design portfolio.',
        is_read: false,
        requires_pro: true,
        metadata: {
          status: 'interview',
          company: 'DesignStudio LLC',
          interviewer: 'Sarah Johnson',
          interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Zoom call'
        }
      },
      // Old read notification
      {
        user_id: userId,
        application_id: applications[0].id,
        type: 'status_update',
        title: 'Application Submitted',
        message: 'Your application has been successfully submitted.',
        is_read: true,
        requires_pro: false,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          status: 'applied'
        }
      }
    ] : [];

    if (mockNotifications.length > 0) {
      const { data: notifications, error: notifError } = await supabase
        .from('user_notifications')
        .insert(mockNotifications)
        .select();

      if (notifError) {
        console.error('Error creating notifications:', notifError);
        // Continue anyway, applications were created
      } else {
        console.log('Created notifications:', notifications?.length);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mock data created successfully!',
      data: {
        applications: applications?.length || 0,
        notifications: mockNotifications.length,
        userId: userId
      },
      instructions: [
        '1. Go to /profile to see the Enhanced Application Tracker',
        '2. Check if you see blurred notifications (if you\'re on FREE tier)',
        '3. Try upgrading to PRO to see full notifications',
        '4. Test the notification read functionality',
        '5. Check the different application statuses'
      ]
    });

  } catch (error) {
    console.error('Error creating mock data:', error);
    return NextResponse.json({
      error: 'Failed to create mock data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET method to check current data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const userId = session.user.id;

    // Check existing applications
    const { data: applications } = await supabase
      .from('user_job_applications')
      .select('*')
      .eq('user_id', userId);

    // Check existing notifications  
    const { data: notifications } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId);

    // Check user's subscription status
    const isPro = session.user.subscriptionStatus === 'PRO';

    return NextResponse.json({
      userId,
      isPro,
      existingData: {
        applications: applications?.length || 0,
        notifications: notifications?.length || 0
      },
      applications: applications || [],
      notifications: notifications || []
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE method to clean up test data
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const userId = session.user.id;

    // Delete test notifications
    await supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', userId);

    // Delete test applications
    await supabase
      .from('user_job_applications')
      .delete()
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up successfully!'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to clean up data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}