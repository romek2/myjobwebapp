// app/api/debug/test-results/route.ts
// Check what the company response test actually created

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const userId = session.user.id;

    // Check all user applications
    const { data: allApplications, error: appError } = await supabase
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

    // Check all company access tokens for this user's applications
    const applicationIds = allApplications?.map(app => app.id.toString()) || [];
    
    let allTokens = [];
    if (applicationIds.length > 0) {
      const { data: tokens, error: tokenError } = await supabase
        .from('company_access_tokens')
        .select('*')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false });

      if (!tokenError) {
        allTokens = tokens || [];
      }
    }

    // Check for recent test tokens (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentTokens = allTokens.filter(token => 
      token.created_at > oneHourAgo && token.metadata?.test === true
    );

    // Check recent applications (last hour)
    const recentApplications = allApplications?.filter(app => 
      app.applied_at > oneHourAgo || app.job_id === 'test-job-for-company-response'
    ) || [];

    return NextResponse.json({
      userId,
      summary: {
        totalApplications: allApplications?.length || 0,
        totalTokens: allTokens.length,
        recentTokens: recentTokens.length,
        recentApplications: recentApplications.length
      },
      allApplications: allApplications?.map(app => ({
        id: app.id,
        jobTitle: app.job_title,
        company: app.company,
        status: app.status,
        appliedAt: app.applied_at,
        jobId: app.job_id,
        isTestApp: app.job_id === 'test-job-for-company-response'
      })) || [],
      allTokens: allTokens.map(token => ({
        token: token.token,
        applicationId: token.application_id,
        companyEmail: token.company_email,
        expiresAt: token.expires_at,
        isTest: token.metadata?.test === true,
        createdAt: token.created_at,
        portalUrl: `${process.env.NEXTAUTH_URL}/company/application/${token.token}`
      })),
      recentActivity: {
        newApplications: recentApplications,
        newTokens: recentTokens
      },
      whatShouldHaveHappened: [
        'The test should have used one of your existing applications OR created a new one',
        'It should have created a company_access_token entry',
        'The token should link to a valid application ID',
        'You should see either 2 existing apps + 1 new token, OR 3 apps total'
      ],
      troubleshooting: {
        checkForTokenErrors: 'Look at the token creation in the test logs',
        checkApplicationMatching: 'Verify application IDs match between tables',
        checkDataTypes: 'application_id might be string vs integer mismatch'
      }
    });

  } catch (error) {
    console.error('Error checking test results:', error);
    return NextResponse.json({
      error: 'Failed to check test results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}