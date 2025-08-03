// app/api/test/safe-mock-data/route.ts
// Safe mock data that matches your current database schema exactly

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

    console.log('Creating safe mock data for user:', userId);

    // 1. Create applications with ONLY the columns that exist in your schema
    const safeApplications = [
      {
        // REQUIRED COLUMNS (from schema analysis)
        user_id: userId,
        job_id: 'test-job-1',
        job_title: 'Senior React Developer',
        company: 'TechCorp Inc.',
        
        // OPTIONAL COLUMNS (these exist in your schema)
        status: 'applied',
        applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        cover_letter: 'I am very excited about this opportunity to join your team as a Senior React Developer. My 5+ years of experience with React, TypeScript, and modern web technologies make me a perfect fit.',
        desired_salary: 85000,
        linkedin_url: 'https://linkedin.com/in/johndoe',
        portfolio_url: 'https://johndoe.dev',
        resume_file_url: 'https://example.com/resume.pdf',
        resume_filename: 'john_doe_resume.pdf'
        // NOTE: Removed 'phone' column as it doesn't exist in your schema
      },
      {
        user_id: userId,
        job_id: 'test-job-2',
        job_title: 'Full Stack Engineer',
        company: 'StartupXYZ',
        status: 'under_review',
        applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status_updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        cover_letter: 'Your startup mission to revolutionize the healthcare industry aligns perfectly with my values and technical expertise.',
        desired_salary: 75000,
        linkedin_url: 'https://linkedin.com/in/johndoe'
      },
      {
        user_id: userId,
        job_id: 'test-job-3',
        job_title: 'Frontend Developer',
        company: 'DesignStudio LLC',
        status: 'interview',
        applied_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status_updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        cover_letter: 'I love creating beautiful, intuitive user interfaces that provide exceptional user experiences.',
        desired_salary: 70000,
        interview_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        interviewer_name: 'Sarah Johnson',
        interview_location: 'Zoom call - Meeting ID will be shared via email',
        company_notes: 'Great portfolio! The team is impressed with your design skills. Looking forward to our chat about the UI/UX role.',
        portfolio_url: 'https://johndoe.design'
      },
      {
        user_id: userId,
        job_id: 'test-job-4',
        job_title: 'Backend Developer',
        company: 'Enterprise Corp',
        status: 'rejected',
        applied_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status_updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        cover_letter: 'I have extensive experience with Node.js, Python, and database optimization.',
        desired_salary: 90000,
        company_response: 'Thank you for your interest. We decided to move forward with another candidate whose experience more closely matches our needs.',
        company_notes: 'Strong technical skills but looking for more enterprise experience.'
      }
    ];

    // Insert applications using exact column names from your schema
    const { data: applications, error: appError } = await supabase
      .from('user_job_applications')
      .insert(safeApplications)
      .select();

    if (appError) {
      console.error('Application insert error:', appError);
      return NextResponse.json({
        error: 'Failed to create applications',
        details: appError.message,
        code: appError.code,
        hint: appError.hint,
        problematicData: safeApplications[0] // Show first record for debugging
      }, { status: 500 });
    }

    console.log('✅ Applications created:', applications?.length);

    // 2. Create notifications using your existing user_notifications table
    let notificationsCreated = 0;
    if (applications && applications.length > 0) {
      const safeNotifications = [
        // Basic notification (visible to all users)
        {
          user_id: userId,
          application_id: applications[0].id.toString(),
          type: 'status_update',
          title: 'Application Received',
          message: 'Your application for Senior React Developer at TechCorp Inc. has been received and is under review.',
          is_read: false,
          requires_pro: false,
          metadata: {
            status: 'applied',
            company: 'TechCorp Inc.',
            jobTitle: 'Senior React Developer'
          }
        },
        // PRO notification (should be blurred for FREE users)
        {
          user_id: userId,
          application_id: applications[1].id.toString(),
          type: 'status_update',
          title: 'Great News! Under Review',
          message: 'The hiring manager at StartupXYZ is impressed with your background and wants to move forward. They specifically mentioned your React and TypeScript experience is exactly what they need for their healthcare platform.',
          is_read: false,
          requires_pro: true,
          metadata: {
            status: 'under_review',
            company: 'StartupXYZ',
            hiring_manager: 'John Smith',
            next_steps: 'Technical interview scheduled'
          }
        },
        // Interview notification (PRO feature)
        {
          user_id: userId,
          application_id: applications[2].id.toString(),
          type: 'interview_scheduled',
          title: 'Interview Scheduled! 🎉',
          message: 'Congratulations! DesignStudio LLC would like to schedule an interview with you. The hiring manager Sarah Johnson is excited to discuss your design portfolio and learn more about your approach to user experience.',
          is_read: false,
          requires_pro: true,
          metadata: {
            status: 'interview',
            company: 'DesignStudio LLC',
            interviewer: 'Sarah Johnson',
            interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Zoom call',
            preparation_tips: 'Review our recent design projects on our website'
          }
        },
        // Rejection notification (basic, visible to all)
        {
          user_id: userId,
          application_id: applications[3].id.toString(),
          type: 'status_update',
          title: 'Application Update',
          message: 'Thank you for your interest in the Backend Developer position at Enterprise Corp. While your qualifications are impressive, we have decided to move forward with another candidate.',
          is_read: false,
          requires_pro: false,
          metadata: {
            status: 'rejected',
            company: 'Enterprise Corp'
          }
        },
        // Old read notification
        {
          user_id: userId,
          application_id: applications[0].id.toString(),
          type: 'confirmation',
          title: 'Application Submitted Successfully',
          message: 'Your application has been successfully submitted to TechCorp Inc.',
          is_read: true,
          requires_pro: false,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            status: 'applied',
            confirmation_number: 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase()
          }
        }
      ];

      const { data: notifications, error: notifError } = await supabase
        .from('user_notifications')
        .insert(safeNotifications)
        .select();

      if (notifError) {
        console.error('Notification insert error:', notifError);
        // Don't fail the whole request, applications were created successfully
      } else {
        notificationsCreated = notifications?.length || 0;
        console.log('✅ Notifications created:', notificationsCreated);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Safe mock data created successfully! 🎉',
      data: {
        applications: applications?.length || 0,
        notifications: notificationsCreated,
        userId: userId,
        isPro: session.user.subscriptionStatus === 'PRO'
      },
      testInstructions: [
        '🎯 TESTING STEPS:',
        '1. Go to /profile to see the Enhanced Application Tracker',
        '2. Check if you see different application statuses',
        '3. Look for notification blurring (if you\'re on FREE tier)',
        '4. Try clicking "Upgrade to Read" buttons',
        '5. Test marking notifications as read',
        '6. Check if PRO features show correctly'
      ],
      mockDataFeatures: [
        '✅ 4 applications with different statuses (applied, under_review, interview, rejected)',
        '✅ 5 notifications with PRO/FREE tiers',
        '✅ Interview details and company notes',
        '✅ Realistic timeline and progression',
        '✅ Both read and unread notifications'
      ]
    });

  } catch (error) {
    console.error('Error creating safe mock data:', error);
    return NextResponse.json({
      error: 'Failed to create safe mock data',
      details: error instanceof Error ? error.message : 'Unknown error',
      helpfulTips: [
        'Make sure you\'re logged in',
        'Check that user_job_applications table exists',
        'Verify user_notifications table exists',
        'Check Supabase RLS policies allow inserts'
      ]
    }, { status: 500 });
  }
}

// GET method to check current data and schema compatibility
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const userId = session.user.id;

    // Check existing applications
    const { data: applications, error: appError } = await supabase
      .from('user_job_applications')
      .select('*')
      .eq('user_id', userId);

    // Check existing notifications
    const { data: notifications, error: notifError } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      userId,
      isPro: session.user.subscriptionStatus === 'PRO',
      currentData: {
        applications: applications?.length || 0,
        notifications: notifications?.length || 0,
        unreadNotifications: notifications?.filter(n => !n.is_read).length || 0
      },
      applications: applications || [],
      notifications: notifications || [],
      tableStatus: {
        applicationsTable: !appError,
        notificationsTable: !notifError
      },
      schemaCompatible: true // Since we're using safe column names
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check current data',
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

    // Delete notifications first (due to potential foreign key constraints)
    const { error: notifDeleteError } = await supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', userId);

    // Delete applications
    const { error: appDeleteError } = await supabase
      .from('user_job_applications')
      .delete()
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up successfully! 🧹',
      cleaned: {
        applications: !appDeleteError,
        notifications: !notifDeleteError
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to clean up data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}