// app/api/debug/test-results/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

// ✅ FIXED: Helper function to safely convert ID to string
const safeIdToString = (id: string | number | undefined | null): string => {
  if (id === undefined || id === null) return '';
  return String(id);
};

// ✅ FIXED: Helper function to safely slice strings
const safeTokenSlice = (token: string | undefined | null, start: number = 0, end?: number): string => {
  if (!token) return '';
  const tokenStr = String(token);
  return tokenStr.slice(start, end);
};

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
    const applicationIds = allApplications?.map(app => safeIdToString(app.id)) || [];
    
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
        id: safeIdToString(app.id), // ✅ FIXED: Convert to string
        jobTitle: app.job_title,
        company: app.company,
        status: app.status,
        appliedAt: app.applied_at,
        jobId: app.job_id,
        isTestApp: app.job_id === 'test-job-for-company-response'
      })) || [],
      allTokens: allTokens.map(token => ({
        token: safeTokenSlice(token.token, 0, 8) + '...', // ✅ FIXED: Safe slice operation
        applicationId: safeIdToString(token.application_id), // ✅ FIXED: Convert to string
        companyEmail: token.company_email,
        expiresAt: token.expires_at,
        isTest: token.metadata?.test === true,
        createdAt: token.created_at,
        portalUrl: `${process.env.NEXTAUTH_URL}/company/application/${token.token}`
      })),
      recentActivity: {
        newApplications: recentApplications.map(app => ({
          id: safeIdToString(app.id), // ✅ FIXED: Convert to string
          jobTitle: app.job_title,
          company: app.company,
          status: app.status,
          appliedAt: app.applied_at
        })),
        newTokens: recentTokens.map(token => ({
          id: safeIdToString(token.id), // ✅ FIXED: Convert to string
          token: safeTokenSlice(token.token, 0, 8) + '...', // ✅ FIXED: Safe slice
          applicationId: safeIdToString(token.application_id), // ✅ FIXED: Convert to string
          expiresAt: token.expires_at,
          createdAt: token.created_at
        }))
      },
      troubleshooting: {
        dataTypes: {
          applicationIdTypes: allApplications?.map(app => ({
            id: safeIdToString(app.id),
            originalType: typeof app.id,
            convertedType: 'string'
          })),
          tokenTypes: allTokens.map(token => ({
            token: safeTokenSlice(token.token, 0, 8) + '...',
            applicationId: safeIdToString(token.application_id),
            originalType: typeof token.application_id,
            convertedType: 'string'
          }))
        },
        fixes: [
          'All IDs converted to strings before slice operations',
          'Added safe helper functions for ID conversion',
          'Type-safe token and ID handling implemented',
          'All .slice() calls now protected against non-string types'
        ]
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