// app/api/admin/process-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { manuallyCheckJobAlerts } from '@/lib/job-alerts';

export async function POST(req: NextRequest) {
  try {
    // Security check - only allow authenticated administrators
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // SECURITY: Check for admin privilege
    // For example, check if the user has a PRO subscription or is an admin
    const isAdmin = process.env.ADMIN_EMAILS?.split(',').includes(session.user.email || '') || 
                    session.user.subscriptionStatus === 'PRO';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Read the request body
    const body = await req.json();
    const { 
      jobIds, 
      testMode = false,
      testEmail = session.user.email 
    } = body;
    
    console.log('Manual job alert processing requested:', {
      user: session.user.email,
      jobIds: jobIds || 'all recent jobs',
      testMode,
      testEmail: testMode ? testEmail : 'N/A'
    });
    
    // If test mode is enabled, we would implement specific logic here
    // For simplicity, we'll just pass through the jobIds for now
    
    // Process job alerts
    const results = await manuallyCheckJobAlerts(jobIds);
    
    return NextResponse.json({
      success: true,
      message: 'Job alert processing complete',
      results
    });
  } catch (error: any) {
    console.error('Error in manual job alert processing:', error);
    
    return NextResponse.json({
      error: 'Failed to process job alerts',
      details: error.message
    }, { 
      status: 500 
    });
  }
}