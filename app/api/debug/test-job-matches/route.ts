// app/api/debug/test-job-matches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Security check - only allow authenticated users
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // SECURITY: Check for PRO subscription
    if (session.user.subscriptionStatus !== 'PRO') {
      return NextResponse.json({ error: 'This feature requires a PRO subscription' }, { status: 403 });
    }
    
    // Read the request body
    const body = await req.json();
    const { testMode = true } = body;
    
    // Get the secret from your environment variables
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    
    // Set up the headers to simulate a cron job request
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${cronSecret}`);
    
    if (testMode) {
      // In test mode, we just select one user to send to (the current user)
      headers.set('X-Test-Mode', 'true');
      headers.set('X-Test-Email', session.user.email || '');
    }
    
    // Call the actual job alert processing endpoint
    const url = `${process.env.NEXTAUTH_URL}/api/alerts/process-matches`;
    console.log(`Calling job alert processor at ${url}`);
    
    const processorResponse = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    if (!processorResponse.ok) {
      const error = await processorResponse.json();
      return NextResponse.json({ 
        error: 'Job alert processing failed', 
        details: error 
      }, { status: 500 });
    }
    
    const result = await processorResponse.json();
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in test-job-matches endpoint:', error);
    
    return NextResponse.json({
      error: 'Failed to test job matches',
      details: error.message
    }, { 
      status: 500 
    });
  }
}