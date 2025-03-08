// app/api/debug/trigger-cron/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    // Security check - only allow authenticated administrators
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // SECURITY: Check for admin privilege - modify this based on your user data model
    // For example, check if the user's email is in an admin list, or if they have an admin role
    const isAdmin = process.env.ADMIN_EMAILS?.split(',').includes(session.user.email || '') || 
                   session.user.subscriptionStatus === 'PRO'; // As a fallback, allow PRO users
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Read the request body
    const body = await req.json();
    const { frequency = 'daily', testMode = true } = body;
    
    // Get the secret from your environment variables
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    
    // Set up the headers to simulate a cron job request
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${cronSecret}`);
    
    if (testMode) {
      // In test mode, we just select one user to send to (presumably the current user)
      headers.set('X-Test-Mode', 'true');
      headers.set('X-Test-Email', session.user.email || '');
    }
    
    // Call the actual cron endpoint
    const cronResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/cron/send-emails?frequency=${frequency}`,
      {
        method: 'GET',
        headers: headers
      }
    );
    
    if (!cronResponse.ok) {
      const error = await cronResponse.json();
      return NextResponse.json({ error: 'Cron job failed', details: error }, { status: 500 });
    }
    
    const result = await cronResponse.json();
    
    return NextResponse.json({
      success: true,
      message: `Manually triggered ${frequency} cron job`,
      result
    });
  } catch (error: any) {
    console.error('Error in manual cron trigger:', error);
    
    return NextResponse.json({
      error: 'Failed to trigger cron job',
      details: error.message
    }, { 
      status: 500 
    });
  }
}