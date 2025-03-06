// app/api/alerts/process/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY is not set. Email functionality will not work.');
}

/**
 * Send job alert email
 */
async function sendJobAlertEmail(userEmail, userName, alertName, matchingJobs) {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('Missing SendGrid configuration');
      return false;
    }

    console.log(`Attempting to send email to ${userEmail} for alert "${alertName}"`);
    
    // Format jobs for email
    const jobsHtml = matchingJobs.map(job => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin-top: 0; margin-bottom: 8px; color: #1e40af;">${job.title}</h3>
        <p style="margin-top: 0; margin-bottom: 8px; color: #4b5563;">${job.company} • ${job.location || 'Remote'}</p>
        ${job.salary ? `<p style="margin-top: 0; margin-bottom: 12px; color: #047857; font-weight: 500;">${job.salary}</p>` : ''}
        <a href="${process.env.NEXTAUTH_URL}/jobs/${job.id}" style="display: inline-block; padding: 8px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">View Job</a>
      </div>
    `).join('');

    // Create email content
    const msg = {
      to: userEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `New Jobs Matching "${alertName}"`,
      text: `Hello ${userName || 'there'}! We found ${matchingJobs.length} new job opportunities matching your "${alertName}" alert.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 20px; background-color: #4f46e5; text-align: center;">
            <h1 style="color: white; margin: 0;">JobMatcher Alerts</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Hello ${userName || 'there'}!</p>
            
            <p style="font-size: 16px;">We found <strong>${matchingJobs.length} new job ${matchingJobs.length === 1 ? 'opportunity' : 'opportunities'}</strong> matching your "${alertName}" alert:</p>
            
            <div style="margin-top: 24px; margin-bottom: 24px;">
              ${jobsHtml}
            </div>
            
            <p style="font-size: 16px;">
              <a href="${process.env.NEXTAUTH_URL}/alerts" style="color: #3b82f6; text-decoration: none;">Manage your job alerts</a>
            </p>
          </div>
          
          <div style="padding: 15px; background-color: #f3f4f6; text-align: center; font-size: 14px; color: #6b7280;">
            <p>Thank you for using JobMatcher!</p>
            <p>To unsubscribe from these notifications, update your <a href="${process.env.NEXTAUTH_URL}/alerts" style="color: #3b82f6;">alert preferences</a>.</p>
          </div>
        </div>
      `
    };

    // Send the email
    const response = await sgMail.send(msg);
    console.log(`Email sent successfully to ${userEmail}. Status code: ${response[0].statusCode}`);
    return true;
  } catch (error) {
    console.error('Error sending alert email:', error);
    if (error.response) {
      console.error('SendGrid API error details:', error.response.body);
    }
    return false;
  }
}

// POST endpoint for manually checking a specific alert
export async function POST(request) {
  // Check authorization
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const data = await request.json();
    const { alertId } = data;
    
    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabase();
    
    // Get the alert details and make sure it belongs to the user
    const { data: alert, error: alertError } = await supabase
      .from('job_alerts')
      .select(`
        id,
        name,
        keywords,
        user_id,
        active,
        users (
          email,
          name,
          subscription_status
        )
      `)
      .eq('id', alertId)
      .eq('user_id', session.user.id)  // Security check
      .single();
    
    if (alertError || !alert) {
      console.error('Error finding alert:', alertError);
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    // Check if the alert is active and user has PRO status
    if (!alert.active) {
      return NextResponse.json({ 
        success: false, 
        message: 'This alert is currently paused. Please activate it first.' 
      });
    }
    
    if (alert.users?.subscription_status !== 'PRO') {
      return NextResponse.json({ 
        success: false, 
        message: 'Premium alerts are only available for PRO subscribers.' 
      });
    }
    
    // Get previously sent jobs to avoid duplicates
    const { data: sentJobs } = await supabase
      .from('job_alert_history')
      .select('job_id')
      .eq('alert_id', alertId);
      
    const excludedJobIds = sentJobs?.map(record => record.job_id) || [];
    
    // Get keywords from alert
    const keywords = alert.keywords.split(',').map(k => k.trim().toLowerCase());
    
    // Build search conditions for each keyword (checking both title and description)
    const searchConditions = [];
    keywords.forEach(keyword => {
      if (keyword.length > 0) {
        searchConditions.push(`title.ilike.%${keyword}%`);
        searchConditions.push(`description.ilike.%${keyword}%`);
      }
    });
    
    if (searchConditions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid keywords found in this alert. Please add some keywords.'
      });
    }
    
    // Search for matching jobs
    let jobsQuery = supabase
      .from('jobs')
      .select('*')
      .or(searchConditions.join(','));
    
    // Exclude already sent jobs
    if (excludedJobIds.length > 0) {
      jobsQuery = jobsQuery.not('id', 'in', `(${excludedJobIds.join(',')})`);
    }
    
    // Limit to recent jobs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    jobsQuery = jobsQuery.gt('posted_at', thirtyDaysAgo.toISOString());
    
    // Limit the number of jobs to return
    jobsQuery = jobsQuery.limit(10);
    
    const { data: matchingJobs, error: jobsError } = await jobsQuery;
    
    if (jobsError) {
      console.error('Error finding matching jobs:', jobsError);
      return NextResponse.json(
        { error: 'Error finding matching jobs' },
        { status: 500 }
      );
    }
    
    if (matchingJobs && matchingJobs.length > 0) {
      // Send email notification
      const emailSent = await sendJobAlertEmail(
        alert.users.email,
        alert.users.name || 'there',
        alert.name,
        matchingJobs
      );
      
      // Record which jobs were sent (only if email was sent successfully)
      if (emailSent) {
        const historyRecords = matchingJobs.map(job => ({
          alert_id: alertId,
          job_id: job.id,
          sent_at: new Date().toISOString()
        }));
        
        await supabase
          .from('job_alert_history')
          .insert(historyRecords);
      }
      
      return NextResponse.json({ 
        success: emailSent,
        jobCount: matchingJobs.length,
        emailSent 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      jobCount: 0,
      message: 'No new matching jobs found for your alert criteria.'
    });
  } catch (error) {
    console.error('Error processing alert:', error);
    return NextResponse.json(
      { error: 'Failed to process alert', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint for processing all alerts (could be called by a cron job)
export async function GET(request) {
  // Check for API key authorization for scheduled runs
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('apiKey');
  const frequency = searchParams.get('frequency') || 'daily';
  
  // Validate API key for production security
  if (process.env.NODE_ENV === 'production') {
    const validApiKey = process.env.ALERTS_CRON_API_KEY;
    if (!validApiKey || apiKey !== validApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  try {
    const supabase = createServerSupabase();
    
    // Get all active alerts matching the requested frequency
    const { data: alerts, error: alertsError } = await supabase
      .from('job_alerts')
      .select(`
        id,
        name,
        keywords,
        frequency,
        user_id,
        users (
          email,
          name,
          subscription_status
        )
      `)
      .eq('active', true)
      .eq('frequency', frequency);
    
    if (alertsError) {
      throw alertsError;
    }
    
    console.log(`Processing ${alerts?.length || 0} active job alerts with frequency: ${frequency}`);
    
    let processedCount = 0;
    let emailsSent = 0;
    
    // Process each alert
    for (const alert of alerts || []) {
      // Skip alerts for non-PRO users
      if (alert.users?.subscription_status !== 'PRO') {
        continue;
      }
      
      try {
        // Get previously sent jobs to avoid duplicates
        const { data: sentJobs } = await supabase
          .from('job_alert_history')
          .select('job_id')
          .eq('alert_id', alert.id);
          
        const excludedJobIds = sentJobs?.map(record => record.job_id) || [];
        
        // Get keywords from alert
        const keywords = alert.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
        
        if (keywords.length === 0) {
          console.log(`Skipping alert ${alert.id} - No valid keywords`);
          continue;
        }
        
        // Build search conditions for each keyword
        const searchConditions = [];
        keywords.forEach(keyword => {
          searchConditions.push(`title.ilike.%${keyword}%`);
          searchConditions.push(`description.ilike.%${keyword}%`);
        });
        
        // Search for matching jobs
        let jobsQuery = supabase
          .from('jobs')
          .select('*')
          .or(searchConditions.join(','));
        
        // Exclude already sent jobs
        if (excludedJobIds.length > 0) {
          jobsQuery = jobsQuery.not('id', 'in', `(${excludedJobIds.join(',')})`);
        }
        
        // For daily alerts, look at last 24 hours
        const timeAgo = new Date();
        if (frequency === 'daily') {
          timeAgo.setDate(timeAgo.getDate() - 1);
        } else if (frequency === 'weekly') {
          timeAgo.setDate(timeAgo.getDate() - 7);
        } else {
          // For real-time, look at last hour
          timeAgo.setHours(timeAgo.getHours() - 1);
        }
        
        jobsQuery = jobsQuery.gt('posted_at', timeAgo.toISOString());
        
        // Limit the number of jobs to return
        jobsQuery = jobsQuery.limit(10);
        
        const { data: matchingJobs, error: jobsError } = await jobsQuery;
        
        if (jobsError) {
          console.error('Error finding matching jobs for alert', alert.id, jobsError);
          continue; // Skip to next alert
        }
        
        if (matchingJobs && matchingJobs.length > 0) {
          console.log(`Found ${matchingJobs.length} matching jobs for alert ${alert.id}`);
          
          // Send email notification
          const emailSent = await sendJobAlertEmail(
            alert.users.email,
            alert.users.name || 'there',
            alert.name,
            matchingJobs
          );
          
          if (emailSent) {
            emailsSent++;
            
            // Record which jobs were sent
            const historyRecords = matchingJobs.map(job => ({
              alert_id: alert.id,
              job_id: job.id,
              sent_at: new Date().toISOString()
            }));
            
            await supabase
              .from('job_alert_history')
              .insert(historyRecords);
          }
        } else {
          console.log(`No new matching jobs for alert ${alert.id}`);
        }
        
        processedCount++;
      } catch (alertError) {
        console.error('Error processing alert', alert.id, alertError);
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: processedCount,
      emailsSent: emailsSent,
      frequency: frequency
    });
  } catch (error) {
    console.error('Error processing job alerts:', error);
    return NextResponse.json(
      { error: 'Failed to process job alerts', details: error.message },
      { status: 500 }
    );
  }
}