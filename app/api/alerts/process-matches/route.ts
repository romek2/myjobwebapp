// app/api/alerts/process-matches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { createServerSupabase } from '@/lib/supabase';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

// Make this a dynamic route with a reasonable timeout for hobby plan
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set to 60 seconds (max for hobby plan)

/**
 * Processes job alerts by checking for new matching jobs
 * and sending email notifications to users
 */
export async function GET(req: NextRequest) {
  try {
    // Verify the request is authorized
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized access to job alert processor');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current date/time
    const now = new Date();
    console.log(`Processing job alerts at ${now.toISOString()}`);
    
    // Check if we're in test mode
    const isTestMode = req.headers.get('X-Test-Mode') === 'true';
    const testEmail = req.headers.get('X-Test-Email');
    
    // Connect to Supabase
    const supabase = createServerSupabase();
    
    // Define types for Supabase join results
    type JobAlertWithUser = {
      id: string;
      name: string;
      keywords: string;
      active: boolean;
      userId: string;
      User: {
        name?: string;
        email?: string;
      } | null;
      JobAlertHistory: {
        jobId: string;
      }[] | null;
    };

    // 1. Get active job alerts - in test mode, only get alerts for test user
    let alertsQuery = supabase
      .from('JobAlert')
      .select(`
        id,
        name,
        keywords,
        active,
        userId,
        User:userId (
          name,
          email
        ),
        JobAlertHistory:JobAlertHistory (
          jobId
        )
      `)
      .eq('active', true);
    
    if (isTestMode && testEmail) {
      // In test mode, get alerts only for the test user
      alertsQuery = alertsQuery.eq('User.email', testEmail);
    }
    
    const { data: alerts, error: alertsError } = await alertsQuery;
    
    if (alertsError) {
      console.error('Error fetching job alerts:', alertsError);
      return NextResponse.json({ error: 'Failed to fetch job alerts' }, { status: 500 });
    }
    
    if (!alerts || alerts.length === 0) {
      console.log('No active alerts found');
      return NextResponse.json({ message: 'No active alerts to process' });
    }
    
    console.log(`Found ${alerts.length} active alerts to process`);
    
    // 2. Get recent jobs (last 24 hours)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: recentJobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        company,
        location,
        description,
        url,
        salary,
        posted_at
      `)
      .gte('posted_at', yesterday.toISOString())
      .order('posted_at', { ascending: false });
    
    if (jobsError) {
      console.error('Error fetching recent jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch recent jobs' }, { status: 500 });
    }
    
    if (!recentJobs || recentJobs.length === 0) {
      console.log('No recent jobs found');
      return NextResponse.json({ message: 'No recent jobs to process' });
    }
    
    console.log(`Found ${recentJobs.length} recent jobs to match against`);
    
    // Define the type for alert processing details
    type AlertProcessingDetail = {
      alertId: string;
      alertName: string;
      status: string;
      userEmail?: string;
      matchesFound?: number;
      jobIds?: string[];
      reason?: string;
      error?: string;
    };

    // Track results
    const results = {
      alertsProcessed: 0,
      matchesFound: 0,
      emailsSent: 0,
      emailsFailed: 0,
      details: [] as AlertProcessingDetail[]
    };
    
    // 3. Process each alert
    for (const alert of alerts as JobAlertWithUser[]) {
      results.alertsProcessed++;
      
      // Skip if user has no email
      if (!alert.User?.email) {
        results.details.push({
          alertId: alert.id,
          alertName: alert.name,
          status: 'skipped',
          reason: 'User has no email'
        });
        continue;
      }
      
      // Parse keywords into an array
      const keywords = alert.keywords
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);
      
      // Get already sent job IDs to avoid duplicates
      const sentJobIds = new Set(
        (alert.JobAlertHistory || [])
          .map(history => history.jobId)
          .filter(Boolean)
      );
      
      // Match jobs against keywords
      const matchingJobs = recentJobs.filter(job => {
        // Skip if already sent
        if (sentJobIds.has(job.id)) return false;
        
        // Check if any keyword matches job title or description
        const jobText = `${job.title} ${job.description}`.toLowerCase();
        return keywords.some(keyword => jobText.includes(keyword));
      });
      
      if (matchingJobs.length === 0) {
        results.details.push({
          alertId: alert.id,
          alertName: alert.name,
          status: 'processed',
          matchesFound: 0
        });
        continue;
      }
      
      results.matchesFound += matchingJobs.length;
      
      // 4. Send email with matching jobs
      try {
        // Create email content
        const userName = alert.User?.name || (alert.User?.email ? alert.User.email.split('@')[0] : 'there');
        
        let emailText = `Hello ${userName},\n\n`;
        emailText += `We found ${matchingJobs.length} new job${matchingJobs.length > 1 ? 's' : ''} matching your "${alert.name}" alert:\n\n`;
        
        let emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a6cf7;">JobMatcher</h2>
            <p>Hello ${userName},</p>
            <p>We found <strong>${matchingJobs.length} new job${matchingJobs.length > 1 ? 's' : ''}</strong> matching your "${alert.name}" alert:</p>
            <div style="margin: 20px 0;">
        `;
        
        // Add jobs to email
        matchingJobs.forEach((job, index) => {
          const jobDate = new Date(job.posted_at).toLocaleDateString();
          
          emailText += `${index + 1}. ${job.title} at ${job.company}\n`;
          emailText += `   Location: ${job.location}\n`;
          emailText += `   Salary: ${job.salary || 'Not specified'}\n`;
          emailText += `   Posted: ${jobDate}\n`;
          emailText += `   Apply here: ${job.url}\n\n`;
          
          emailHtml += `
            <div style="margin-bottom: 25px; border-left: 4px solid #4a6cf7; padding-left: 15px;">
              <h3 style="margin: 0 0 5px 0;">${job.title}</h3>
              <p style="margin: 0 0 5px 0; color: #666;">at ${job.company}</p>
              <p style="margin: 0 0 5px 0;"><strong>Location:</strong> ${job.location}</p>
              ${job.salary ? `<p style="margin: 0 0 5px 0;"><strong>Salary:</strong> ${job.salary}</p>` : ''}
              <p style="margin: 0 0 10px 0;"><strong>Posted:</strong> ${jobDate}</p>
              <a href="${job.url}" style="background-color: #4a6cf7; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">View Job</a>
            </div>
          `;
        });
        
        emailHtml += `
            </div>
            <p>You can manage your job alerts in your <a href="${process.env.NEXTAUTH_URL}/alerts" style="color: #4a6cf7; text-decoration: underline;">JobMatcher account</a>.</p>
            <p>Happy job hunting!</p>
            <p>The JobMatcher Team</p>
          </div>
        `;
        
        emailText += `You can manage your job alerts in your JobMatcher account: ${process.env.NEXTAUTH_URL}/alerts\n\n`;
        emailText += `Happy job hunting!\n\nThe JobMatcher Team`;
        
        // Ensure we have an email to send to
        if (!alert.User?.email) {
          throw new Error('User email is missing');
        }

        // Send the email
        const msg = {
          to: alert.User.email,
          from: process.env.SENDGRID_FROM_EMAIL as string,
          subject: isTestMode 
            ? `[TEST] JobMatcher - ${matchingJobs.length} new matching jobs for you!`
            : `JobMatcher - ${matchingJobs.length} new matching jobs for you!`,
          text: emailText,
          html: emailHtml,
        };
        
        await sgMail.send(msg);
        console.log(`Email sent to ${alert.User.email} with ${matchingJobs.length} matching jobs`);
        results.emailsSent++;
        
        // 5. Record history in database
        for (const job of matchingJobs) {
          await supabase
            .from('JobAlertHistory')
            .insert({
              alertId: alert.id,
              jobId: job.id,
              sentAt: now.toISOString()
            });
        }
        
        results.details.push({
          alertId: alert.id,
          alertName: alert.name,
          userEmail: alert.User.email,
          status: 'success',
          matchesFound: matchingJobs.length,
          jobIds: matchingJobs.map(job => job.id)
        });
      } catch (emailError: any) {
        console.error(`Error sending email for alert ${alert.id}:`, emailError);
        results.emailsFailed++;
        
        results.details.push({
          alertId: alert.id,
          alertName: alert.name,
          status: 'error',
          error: emailError.message,
          matchesFound: matchingJobs.length
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      mode: isTestMode ? 'test' : 'production',
      results
    });
  } catch (error: any) {
    console.error('Error processing job alerts:', error);
    
    return NextResponse.json({
      error: 'Failed to process job alerts',
      details: error.message
    }, { 
      status: 500 
    });
  }
}