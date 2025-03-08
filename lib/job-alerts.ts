// lib/job-alerts.ts
import { createServerSupabase } from './supabase';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

// Types for job and alert data
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
  posted_at: string;
  [key: string]: any; // For any additional fields
}

interface JobAlert {
  id: string;
  name: string;
  keywords: string;
  active: boolean;
  userId: string;
  User?: {
    name?: string;
    email?: string;
  };
  JobAlertHistory?: {
    jobId: string;
  }[];
}

/**
 * Process all matching alerts for a newly added job
 */
export async function processMatchingAlerts(job: Job): Promise<{
  matched: number;
  emailed: number;
  errors: number;
}> {
  console.log(`Processing alerts for job ID ${job.id}: ${job.title}`);
  
  // Track processing metrics
  const results = {
    matched: 0,
    emailed: 0,
    errors: 0
  };
  
  try {
    // Initialize Supabase client
    const supabase = createServerSupabase();
    
    // 1. Get all active alerts with their users and history
    const { data: alerts, error: alertsError } = await supabase
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
    
    if (alertsError) {
      console.error('Error fetching job alerts:', alertsError);
      throw alertsError;
    }
    
    if (!alerts || alerts.length === 0) {
      console.log('No active alerts found');
      return results;
    }
    
    console.log(`Found ${alerts.length} active alerts to check against job`);
    
    // 2. For each alert, check if the job matches the keywords
    for (const alert of alerts as JobAlert[]) {
      // Skip if user has no email
      if (!alert.User?.email) {
        console.log(`Skipping alert ${alert.id} - No user email`);
        continue;
      }
      
      // Check if this job has already been sent to this alert
      const alreadySent = alert.JobAlertHistory?.some(h => h.jobId === job.id);
      if (alreadySent) {
        console.log(`Job ${job.id} already sent to alert ${alert.id}`);
        continue;
      }
      
      // Check if job matches alert keywords
      if (jobMatchesAlert(job, alert)) {
        results.matched++;
        console.log(`Job ${job.id} matches alert ${alert.id}`);
        
        try {
          // Send email notification
          await sendAlertEmail(alert, job);
          results.emailed++;
          
          // Record match in history
          await supabase
            .from('JobAlertHistory')
            .insert({
              alertId: alert.id,
              jobId: job.id,
              sentAt: new Date().toISOString()
            });
        } catch (error) {
          console.error(`Error processing match for alert ${alert.id}:`, error);
          results.errors++;
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in processMatchingAlerts:', error);
    throw error;
  }
}

/**
 * Check if a job matches an alert's keywords
 */
function jobMatchesAlert(job: Job, alert: JobAlert): boolean {
  // Convert keywords string to array and normalize
  const keywords = alert.keywords
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0);
  
  // Combine job fields for searching
  const jobText = `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase();
  
  // Check if any keyword matches the job text
  return keywords.some(keyword => jobText.includes(keyword));
}

/**
 * Send an email notification for a matching job
 */
async function sendAlertEmail(alert: JobAlert, job: Job): Promise<void> {
  if (!alert.User?.email) {
    throw new Error('User email is missing');
  }
  
  // Format job date
  const jobDate = new Date(job.posted_at).toLocaleDateString();
  
  // Get user name or fallback
  const userName = alert.User.name || alert.User.email.split('@')[0] || 'there';
  
  // Create email content
  let emailText = `Hello ${userName},\n\n`;
  emailText += `We found a new job matching your "${alert.name}" alert:\n\n`;
  emailText += `${job.title} at ${job.company}\n`;
  emailText += `Location: ${job.location}\n`;
  if (job.salary) emailText += `Salary: ${job.salary}\n`;
  emailText += `Posted: ${jobDate}\n\n`;
  emailText += `${job.description.substring(0, 200)}...\n\n`;
  emailText += `View and apply: ${job.url}\n\n`;
  emailText += `You can manage your job alerts in your account: ${process.env.NEXTAUTH_URL}/alerts\n\n`;
  emailText += `Happy job hunting!\n\nThe JobMatcher Team`;
  
  let emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a6cf7;">JobMatcher</h2>
      <p>Hello ${userName},</p>
      <p>We found a new job matching your "${alert.name}" alert:</p>
      
      <div style="margin: 20px 0; border-left: 4px solid #4a6cf7; padding-left: 15px;">
        <h3 style="margin: 0 0 5px 0;">${job.title}</h3>
        <p style="margin: 0 0 5px 0; color: #666;">at ${job.company}</p>
        <p style="margin: 0 0 5px 0;"><strong>Location:</strong> ${job.location}</p>
        ${job.salary ? `<p style="margin: 0 0 5px 0;"><strong>Salary:</strong> ${job.salary}</p>` : ''}
        <p style="margin: 0 0 10px 0;"><strong>Posted:</strong> ${jobDate}</p>
        <p style="margin: 0 0 15px 0;">${job.description.substring(0, 200)}...</p>
        <a href="${job.url}" style="background-color: #4a6cf7; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">View Job</a>
      </div>
      
      <p>You can manage your job alerts in your <a href="${process.env.NEXTAUTH_URL}/alerts" style="color: #4a6cf7; text-decoration: underline;">JobMatcher account</a>.</p>
      <p>Happy job hunting!</p>
      <p>The JobMatcher Team</p>
    </div>
  `;
  
  // Send the email
  const msg = {
    to: alert.User.email,
    from: process.env.SENDGRID_FROM_EMAIL as string,
    subject: `JobMatcher - New Job Match: ${job.title} at ${job.company}`,
    text: emailText,
    html: emailHtml,
  };
  
  await sgMail.send(msg);
  console.log(`Email sent to ${alert.User.email} for job ${job.id}`);
}

/**
 * Run a job alert check manually (for testing or admin purposes)
 */
export async function manuallyCheckJobAlerts(jobIds?: string[]): Promise<{
  processed: number;
  matched: number;
  emailed: number;
  errors: number;
}> {
  // Initialize Supabase client
  const supabase = createServerSupabase();
  
  // Get jobs to process
  let jobsQuery = supabase.from('jobs').select('*');
  
  // If specific job IDs are provided, only process those
  if (jobIds && jobIds.length > 0) {
    jobsQuery = jobsQuery.in('id', jobIds);
  } else {
    // Otherwise, get recent jobs (last 24 hours by default)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    jobsQuery = jobsQuery.gte('posted_at', oneDayAgo.toISOString());
  }
  
  // Execute query
  const { data: jobs, error: jobsError } = await jobsQuery;
  
  if (jobsError) {
    console.error('Error fetching jobs:', jobsError);
    throw jobsError;
  }
  
  if (!jobs || jobs.length === 0) {
    console.log('No jobs found to process');
    return { processed: 0, matched: 0, emailed: 0, errors: 0 };
  }
  
  console.log(`Processing ${jobs.length} jobs for alerts`);
  
  // Track all results
  const results = {
    processed: jobs.length,
    matched: 0,
    emailed: 0,
    errors: 0
  };
  
  // Process each job
  for (const job of jobs) {
    try {
      const jobResult = await processMatchingAlerts(job);
      results.matched += jobResult.matched;
      results.emailed += jobResult.emailed;
      results.errors += jobResult.errors;
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      results.errors++;
    }
  }
  
  return results;
}