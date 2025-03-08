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
    
    // Get frequency from query parameters (default to 'daily')
    const { searchParams } = new URL(req.url);
    const frequency = searchParams.get('frequency') || 'daily';
    
    // Check if we're in test mode
    const isTestMode = req.headers.get('X-Test-Mode') === 'true';
    const testEmail = req.headers.get('X-Test-Email');
    
    // Connect to Supabase
    const supabase = createServerSupabase();
    
    // Get users who should receive emails
    let userQuery = supabase
      .from('User')
      .select('id, email, name, subscriptionStatus');
      
    if (isTestMode && testEmail) {
      // In test mode, only send to the specified test email
      console.log(`Test mode enabled - sending only to ${testEmail}`);
      userQuery = userQuery.eq('email', testEmail);
    } else {
      // In normal mode, only send to PRO users
      userQuery = userQuery.eq('subscriptionStatus', 'PRO');
      
      // For future - add frequency filtering:
      // If we're processing weekly emails, only get users with weekly alerts
      /* 
      if (frequency === 'weekly') {
        // This would require joining with the JobAlert table
        userQuery = userQuery.eq('jobAlerts.frequency', 'weekly');
      }
      */
    }
    
    const { data: users, error: userError } = await userQuery;
      
    if (userError) {
      console.error('Error fetching users:', userError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    console.log(`Found ${users?.length || 0} users to email for ${frequency} alerts`);
    
    // Get alerts for these users if not in test mode
    let alerts = [];
    if (!isTestMode && users?.length) {
      const userIds = users.map(user => user.id);
      
      const { data: userAlerts, error: alertError } = await supabase
        .from('JobAlert')
        .select('*')
        .in('userId', userIds)
        .eq('frequency', frequency)
        .eq('active', true);
        
      if (alertError) {
        console.error('Error fetching alerts:', alertError);
      } else {
        alerts = userAlerts || [];
        console.log(`Found ${alerts.length} active ${frequency} alerts`);
      }
    }
    
    // Track successful emails
    const emailResults = [];
    
    // Send emails to each user
    for (const user of users || []) {
      if (!user.email) continue;
      
      try {
        // If not in test mode, get this user's alerts
        const userAlerts = isTestMode ? [] : alerts.filter(alert => alert.userId === user.id);
        
        // Create email content
        let emailText = `Hello ${user.name || 'there'},\n\n`;
        let emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a6cf7;">JobMatcher</h2>
            <p>Hello ${user.name || 'there'},</p>
        `;
        
        if (isTestMode) {
          emailText += `This is a TEST email from our cron job that runs at ${now.toISOString()}.\n\n`;
          emailHtml += `<p>This is a <strong>TEST</strong> email from our cron job that runs at ${now.toISOString()}.</p>`;
        } else if (userAlerts.length > 0) {
          emailText += `You have ${userAlerts.length} active job alerts. Here are your latest matches:\n\n`;
          emailHtml += `<p>You have ${userAlerts.length} active job alerts. Here are your latest matches:</p>
            <ul style="padding-left: 20px;">`;
          
          // List alerts in the email
          userAlerts.forEach(alert => {
            emailText += `- ${alert.name} (Keywords: ${alert.keywords})\n`;
            emailHtml += `<li style="margin-bottom: 10px;"><strong>${alert.name}</strong> (Keywords: ${alert.keywords})</li>`;
          });
          
          emailHtml += `</ul>`;
        } else {
          emailText += `This is your scheduled ${frequency} update from JobMatcher.\n\n`;
          emailHtml += `<p>This is your scheduled ${frequency} update from JobMatcher.</p>`;
        }
        
        emailText += `Thank you for being a PRO subscriber!\n\nThe JobMatcher Team`;
        emailHtml += `
            <p>Thank you for being a PRO subscriber!</p>
            <p>The JobMatcher Team</p>
          </div>
        `;
        
        // Send the email
        const msg = {
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL as string,
          subject: isTestMode 
            ? `JobMatcher - TEST Alert (${frequency})`
            : `JobMatcher - Your ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Job Alerts`,
          text: emailText,
          html: emailHtml,
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
      mode: isTestMode ? 'test' : 'production',
      frequency,
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