// app/api/test-notification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/services/notificationService';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { applicationId, status, companyNotes, interviewDate, interviewer, location } = await req.json();

    if (!applicationId || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: applicationId and status' 
      }, { status: 400 });
    }

    console.log(`🧪 Testing notification for application ${applicationId} with status ${status}`);

    // Verify the application exists and belongs to the user
    const supabase = createServerSupabase();
    const { data: application, error } = await supabase
      .from('user_job_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', session.user.id)
      .single();

    if (error || !application) {
      return NextResponse.json({ 
        error: 'Application not found or you do not have permission to access it' 
      }, { status: 404 });
    }

    // Send the notification
    await notificationService.handleStatusUpdate(
      applicationId,
      status,
      companyNotes,
      interviewDate,
      interviewer,
      location
    );

    return NextResponse.json({
      success: true,
      message: `Test notification sent for application ${applicationId}`,
      details: {
        applicationId,
        status,
        jobTitle: application.job_title,
        company: application.company,
        userEmail: session.user.email
      }
    });

  } catch (error: any) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's applications for testing
    const supabase = createServerSupabase();
    const { data: applications, error } = await supabase
      .from('user_job_applications')
      .select('id, job_title, company, status')
      .eq('user_id', session.user.id)
      .order('applied_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Available applications for testing notifications',
      applications: applications || [],
      availableStatuses: [
        'applied',
        'under_review', 
        'interview',
        'offer',
        'hired',
        'rejected',
        'withdrawn'
      ],
      example: {
        method: 'POST',
        body: {
          applicationId: applications?.[0]?.id || 'your-application-id',
          status: 'interview',
          companyNotes: 'We were impressed with your background and would like to schedule an interview.',
          interviewDate: '2025-01-15T14:00:00Z',
          interviewer: 'John Smith',
          location: 'Conference Room A / Zoom'
        }
      }
    });

  } catch (error: any) {
    console.error('Error in test notification GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test data', details: error.message },
      { status: 500 }
    );
  }
}