// app/api/debug/company-portal/route.ts - NEW DEBUG API
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { magicLinkService } from '@/lib/services/magicLinkService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const userId = session.user.id;

    console.log(`🔍 Debugging company portal for user: ${userId}`);

    // Get user's applications
    const { data: applications, error: appError } = await supabase
      .from('user_job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (appError) {
      return NextResponse.json({
        error: 'Failed to fetch applications',
        details: appError.message
      }, { status: 500 });
    }

    // Get tokens for these applications
    const applicationIds = applications?.map(app => app.id.toString()) || [];
    
    let tokens = [];
    if (applicationIds.length > 0) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('company_access_tokens')
        .select('*')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false });

      if (!tokenError) {
        tokens = tokenData || [];
      }
    }

    // Test each token to see if it works
    const tokenTests = [];
    for (const token of tokens.slice(0, 3)) { // Test up to 3 tokens
      try {
        console.log(`🧪 Testing token: ${token.token}`);
        const testResult = await magicLinkService.getApplicationForMagicLink(token.token);
        
        tokenTests.push({
          token: token.token,
          applicationId: token.application_id,
          success: !!testResult,
          hasApplication: !!testResult?.application,
          hasJob: !!testResult?.job,
          applicationCompany: testResult?.application?.company,
          applicationTitle: testResult?.application?.job_title,
          error: testResult ? null : 'Failed to load application data'
        });
      } catch (error) {
        tokenTests.push({
          token: token.token,
          applicationId: token.application_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Check for data type issues
    const dataTypeAnalysis = {
      applicationIdTypes: applications?.map(app => ({
        id: app.id,
        type: typeof app.id,
        value: app.id
      })),
      tokenApplicationIdTypes: tokens.map(token => ({
        applicationId: token.application_id,
        type: typeof token.application_id,
        value: token.application_id
      }))
    };

    return NextResponse.json({
      userId,
      summary: {
        totalApplications: applications?.length || 0,
        totalTokens: tokens.length,
        workingTokens: tokenTests.filter(t => t.success).length,
        brokenTokens: tokenTests.filter(t => !t.success).length
      },
      applications: applications?.map(app => ({
        id: app.id,
        jobTitle: app.job_title,
        company: app.company,
        status: app.status,
        appliedAt: app.applied_at
      })) || [],
      tokens: tokens.map(token => ({
        token: token.token.substring(0, 8) + '...',
        applicationId: token.application_id,
        companyEmail: token.company_email,
        expiresAt: token.expires_at,
        portalUrl: `${process.env.NEXTAUTH_URL}/company/application/${token.token}`
      })),
      tokenTests,
      dataTypeAnalysis,
      troubleshooting: {
        commonIssues: [
          'Application ID type mismatch (string vs integer)',
          'Foreign key constraint issues',
          'Missing application data',
          'Expired or invalid tokens'
        ],
        nextSteps: [
          'Check if application IDs match between tables',
          'Verify token expiration dates',
          'Test magic link service directly',
          'Check database constraints and types'
        ]
      }
    });

  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json({
      error: 'Failed to debug company portal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST method to test a specific token
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    console.log(`🧪 Testing specific token: ${token}`);

    // Test the token directly
    const result = await magicLinkService.getApplicationForMagicLink(token);
    
    return NextResponse.json({
      token: token.substring(0, 8) + '...',
      success: !!result,
      data: result ? {
        hasApplication: !!result.application,
        hasJob: !!result.job,
        hasLinkData: !!result.linkData,
        applicationDetails: result.application ? {
          id: result.application.id,
          jobTitle: result.application.job_title,
          company: result.application.company,
          status: result.application.status
        } : null,
        jobDetails: result.job ? {
          id: result.job.id,
          title: result.job.title,
          company: result.job.company
        } : null
      } : null,
      portalUrl: `${process.env.NEXTAUTH_URL}/company/application/${token}`
    });

  } catch (error) {
    console.error('Error testing token:', error);
    return NextResponse.json({
      error: 'Failed to test token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}