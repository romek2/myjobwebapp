// app/api/cron/send-emails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { createServerSupabase } from '@/lib/supabase';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

// This is for Vercel security - it verifies the request is coming from a legitimate cron job
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set max duration to 5 minutes

export async function GET(req: NextRequest) {
  try {
    // Verify cron job secret (for security)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized access to cron job');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current date/time
    const now = new Date();
    console.log(`Cron job running at ${now.toISOString()}`);
    
    // Connect to Supabase
    const supabase = createServerSupabase();
    
    // Get users who should receive emails
    // In this example, we're getting all PRO users
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('id, email, name, subscriptionStatus')
      .eq('subscriptionStatus', 'PRO');
      
    if (userError) {
      console.error('Error fetching users:', userError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    console.log(`Found ${users?.length || 0} users to email`);
    
    // Track successful emails
    const emailResults = [];
    
    // Send emails to each user
    for (const user of users || []) {
      if (!user.email) continue;
      
      try {
        const msg = {
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL as string,
          subject: 'JobMatcher - Scheduled Update',
          text: `Hello ${user.name || 'there'},\n\nThis is a scheduled email from our cron job that runs at ${now.toISOString()}.\n\nThank you for being a PRO subscriber!\n\nThe JobMatcher Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4a6cf7;">JobMatcher</h2>
              <p>Hello ${user.name || 'there'},</p>
              <p>This is a scheduled email from our cron job that runs at ${now.toISOString()}.</p>
              <p>Thank you for being a PRO subscriber!</p>
              <p>The JobMatcher Team</p>
            </div>
          `,
        };
        
        await sgMail.send(msg);
        console.log(`Email sent to ${user.email}`);
        
        emailResults.push({
          userId: user.id,
          email: user.email,
          status: 'success'
        });
      } catch (emailError: any) {
        console.error(`Error sending email to ${user.email}:`, emailError);
        
        emailResults.push({
          userId: user.id,
          email: user.email,
          status: 'error',
          error: emailError.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      emailsSent: emailResults.filter(r => r.status === 'success').length,
      emailsFailed: emailResults.filter(r => r.status === 'error').length,
      results: emailResults
    });
  } catch (error: any) {
    console.error('Error in cron job:', error);
    
    return NextResponse.json({
      error: 'Failed to process cron job',
      details: error.message
    }, { 
      status: 500 
    });
  }
}