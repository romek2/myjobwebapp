// app/api/test/company-response/route.ts
// Test the company response flow without needing real emails

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const userId = session.user.id;

    // Step 1: Check if user has any existing applications to update
    const { data: existingApps } = await supabase
      .from('user_job_applications')
      .select('*')
      .eq('user_id', userId)
      .limit(3);

    let applicationId;
    
    if (existingApps && existingApps.length > 0) {
      // Use existing application
      applicationId = existingApps[0].id;
      console.log('Using existing application:', applicationId);
    } else {
      // Create a quick test application first
      const { data: newApp, error: appError } = await supabase
        .from('user_job_applications')
        .insert({
          user_id: userId,
          job_id: 'test-job-for-company-response',
          job_title: 'Senior React Developer',
          company: 'TechCorp Inc.',
          status: 'applied',
          applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          cover_letter: 'I am excited about this opportunity...'
        })
        .select()
        .single();

      if (appError) {
        return NextResponse.json({
          error: 'Failed to create test application',
          details: appError.message
        }, { status: 500 });
      }

      applicationId = newApp.id;
      console.log('Created new application:', applicationId);
    }

    // Step 2: Create a magic link token for the company
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: tokenData, error: tokenError } = await supabase
      .from('company_access_tokens')
      .insert({
        token: token,
        company_email: 'hiring@techcorp.com',
        job_id: 'test-job-for-company-response',
        application_id: applicationId.toString(),
        expires_at: expiresAt.toISOString(),
        metadata: { 
          test: true, 
          created_for: 'testing_company_response_flow',
          applicant_name: session.user.name || 'Test User'
        }
      })
      .select()
      .single();

    if (tokenError) {
      return NextResponse.json({
        error: 'Failed to create magic link token',
        details: tokenError.message,
        hint: 'Make sure company_access_tokens table exists'
      }, { status: 500 });
    }

    // Step 3: Generate the company portal URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.workr.tech';
    const companyPortalUrl = `${baseUrl}/company/application/${token}`;

    return NextResponse.json({
      success: true,
      message: 'Company response test setup complete! 🎉',
      testFlow: {
        step1: 'Application created/found',
        step2: 'Magic link token generated',
        step3: 'Company portal URL ready',
        step4: 'Visit the URL to simulate company response',
        step5: 'Check /profile to see updates in Application Tracker'
      },
      testUrls: {
        companyPortal: companyPortalUrl,
        applicationTracker: `${baseUrl}/profile`
      },
      testData: {
        applicationId: applicationId,
        token: token,
        userId: userId,
        expiresAt: expiresAt.toISOString()
      },
      instructions: [
        '🏢 COMPANY SIMULATION:',
        `1. Open: ${companyPortalUrl}`,
        '2. You\'ll see the company portal with application details',
        '3. Update the status (e.g., "Under Review" or "Interview")',
        '4. Add company notes and interview details',
        '5. Click "Update & Notify Candidate"',
        '',
        '👤 USER EXPERIENCE:',
        `6. Go to: ${baseUrl}/profile`,
        '7. Check the Application Tracker component',
        '8. You should see the status update and notifications',
        '9. Test PRO vs FREE notification blurring'
      ]
    });

  } catch (error) {
    console.error('Error setting up company response test:', error);
    return NextResponse.json({
      error: 'Failed to setup company response test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET method to check the current test setup
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
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    // Check existing tokens
    const { data: tokens } = await supabase
      .from('company_access_tokens')
      .select('*')
      .in('application_id', applications?.map(app => app.id.toString()) || [])
      .order('created_at', { ascending: false });

    // Check notifications
    const { data: notifications } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://your-app.vercel.app';

    return NextResponse.json({
      userId,
      isPro: session.user.subscriptionStatus === 'PRO',
      currentData: {
        applications: applications?.length || 0,
        activeTokens: tokens?.filter(t => new Date(t.expires_at) > new Date()).length || 0,
        notifications: notifications?.length || 0,
        unreadNotifications: notifications?.filter(n => !n.is_read).length || 0
      },
      activeTestLinks: tokens?.filter(t => new Date(t.expires_at) > new Date()).map(token => ({
        companyPortalUrl: `${baseUrl}/company/application/${token.token}`,
        applicationId: token.application_id,
        expiresAt: token.expires_at,
        companyEmail: token.company_email
      })) || [],
      recentApplications: applications?.slice(0, 3).map(app => ({
        id: app.id,
        jobTitle: app.job_title,
        company: app.company,
        status: app.status,
        appliedAt: app.applied_at,
        lastUpdated: app.status_updated_at
      })) || []
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check test setup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE method to clean up test tokens and data
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const userId = session.user.id;

    // Get user's applications to find related tokens
    const { data: applications } = await supabase
      .from('user_job_applications')
      .select('id')
      .eq('user_id', userId);

    const applicationIds = applications?.map(app => app.id.toString()) || [];

    // Delete test tokens
    if (applicationIds.length > 0) {
      await supabase
        .from('company_access_tokens')
        .delete()
        .in('application_id', applicationIds)
        .eq('metadata->test', true);
    }

    // Delete test notifications
    await supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', userId);

    // Delete test applications (optional - only if they're test ones)
    await supabase
      .from('user_job_applications')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', 'test-job-for-company-response');

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up successfully! 🧹'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to clean up test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}