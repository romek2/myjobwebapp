// src/app/api/jobs/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { extractTechStack } from '@/lib/constants/tech-keywords';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const JOBS_PER_PAGE = 10;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title')?.toLowerCase() || '';
  const location = searchParams.get('location')?.toLowerCase() || '';
  const minSalary = searchParams.get('minSalary');
  const techStack = searchParams.get('techStack')?.split(',') || [];
  const page = parseInt(searchParams.get('page') || '1');

  try {
    // Build the query for counting total jobs
    let countQuery = supabase
      .from('jobs')
      .select('id', { count: 'exact' });
    
    // Apply filters for title and location
    if (title) {
      countQuery = countQuery.ilike('title', `%${title}%`);
    }
    
    if (location) {
      countQuery = countQuery.ilike('location', `%${location}%`);
    }
    
    // Execute count query
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error counting jobs:', countError);
      return NextResponse.json(
        { error: 'Failed to count jobs' },
        { status: 500 }
      );
    }
    
    // Calculate pagination
    const totalJobs = count || 0;
    
    // Build the query for fetching jobs
    let jobsQuery = supabase
      .from('jobs')
      .select(`
        id, 
        title, 
        company, 
        location, 
        description, 
        url, 
        source,
        posted_at,
        salary,
        job_tech(
          tech(id, name)
        )
      `);
    
    // Apply the same filters
    if (title) {
      jobsQuery = jobsQuery.ilike('title', `%${title}%`);
    }
    
    if (location) {
      jobsQuery = jobsQuery.ilike('location', `%${location}%`);
    }
    
    // Apply pagination
    jobsQuery = jobsQuery
      .order('posted_at', { ascending: false })
      .range((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE - 1);
    
    // Execute jobs query
    const { data: jobs, error: jobsError } = await jobsQuery;
    
    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }
    
    // Format the results
    const formattedJobs = jobs.map(job => {
      // Extract tech stack from both stored tech stack and description
      const descriptionTechStack = extractTechStack(job.description);
      
      // Extract tech names from the job_tech relation
      const storedTechStack = job.job_tech
        ? job.job_tech.map((jt: any) => jt.tech?.name).filter(Boolean)
        : [];
      
      // Combine and deduplicate tech stack
      const combinedTechStack = Array.from(new Set([...storedTechStack, ...descriptionTechStack]));
      
      // Filter by tech stack if specified (client-side filtering as Supabase doesn't support complex array filtering)
      if (techStack.length > 0) {
        // If no matching tech is found, return null to filter this job out
        const hasMatchingTech = techStack.some(tech => 
          combinedTechStack.includes(tech)
        );
        
        if (!hasMatchingTech) {
          return null;
        }
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        url: job.url,
        salary: job.salary,
        postedAt: job.posted_at,
        techStack: combinedTechStack,
        match: 0
      };
    }).filter(Boolean); // Filter out null entries (those that didn't match tech stack)

    return NextResponse.json({
      jobs: formattedJobs,
      total: techStack.length > 0 ? formattedJobs.length : totalJobs,
      totalPages: techStack.length > 0 
        ? Math.ceil(formattedJobs.length / JOBS_PER_PAGE) 
        : Math.ceil(totalJobs / JOBS_PER_PAGE),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const jobData = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'company', 'location', 'description', 'url'];
    for (const field of requiredFields) {
      if (!jobData[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }
    
    // Add timestamp if not provided
    if (!jobData.posted_at) {
      jobData.posted_at = new Date().toISOString();
    }
    
    // Insert the job
    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select();
    
    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json({ 
        error: 'Failed to create job', 
        details: jobError.message 
      }, { status: 500 });
    }
    
    if (!newJob || newJob.length === 0) {
      return NextResponse.json({ 
        error: 'Job created but no data returned' 
      }, { status: 500 });
    }
    
    const createdJob = newJob[0];
    console.log(`Created job: ${createdJob.id} - ${createdJob.title}`);
    
    // Process tech stack from description
    if (createdJob.description) {
      const techStack = extractTechStack(createdJob.description);
      if (techStack.length > 0) {
        await storeTechStackForJob(createdJob.id, techStack);
      }
    }
    
    // Process job alerts in the background
    processJobAlerts(createdJob)
      .then(result => {
        console.log(`Alert processing complete for job ${createdJob.id}:`, result);
      })
      .catch(err => {
        console.error(`Error processing alerts for job ${createdJob.id}:`, err);
      });
    
    return NextResponse.json({
      success: true,
      job: createdJob
    });
  } catch (error: any) {
    console.error('Error in POST /api/jobs:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// Store tech stack for a job
async function storeTechStackForJob(jobId: string, techStack: string[]) {
  try {
    // For each tech in the stack
    for (const techName of techStack) {
      // Find or create the tech entry
      const { data: techData, error: techError } = await supabase
        .from('tech')
        .select('id')
        .eq('name', techName)
        .maybeSingle();
      
      if (techError) {
        console.error(`Error checking for tech ${techName}:`, techError);
        continue;
      }
      
      let techId;
      
      if (techData) {
        techId = techData.id;
      } else {
        // Create a new tech entry
        const { data: newTech, error: createError } = await supabase
          .from('tech')
          .insert({ name: techName })
          .select();
        
        if (createError) {
          console.error(`Error creating tech ${techName}:`, createError);
          continue;
        }
        
        if (!newTech || newTech.length === 0) {
          console.error(`Failed to create tech ${techName}: No data returned`);
          continue;
        }
        
        techId = newTech[0].id;
      }
      
      // Create the relationship between job and tech
      const { error: relationError } = await supabase
        .from('job_tech')
        .insert({
          job_id: jobId,
          tech_id: techId
        });
      
      if (relationError) {
        console.error(`Error associating tech ${techName} with job ${jobId}:`, relationError);
      }
    }
  } catch (error: any) {
    console.error('Error storing tech stack:', error);
  }
}

// Define TypeScript interfaces for our data structures
interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  posted_at: string;
  salary?: string;
  [key: string]: any;
}

interface UserData {
  name?: string;
  email?: string;
}

interface JobAlertHistoryData {
  jobId: string;
}

interface JobAlertData {
  id: string;
  name: string;
  keywords: string;
  active: boolean;
  userId: string;
  User?: UserData | null;
  JobAlertHistory?: JobAlertHistoryData[] | null;
}

// Process job alerts for a newly created job
async function processJobAlerts(job: JobData) {
  try {
    console.log(`Processing alerts for job: ${job.title}`);
    
    // Get all active alerts
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
      console.error('Error fetching alerts:', alertsError);
      return { matched: 0, emailed: 0, errors: 0 };
    }
    
    if (!alerts || alerts.length === 0) {
      console.log('No active alerts to process');
      return { matched: 0, emailed: 0, errors: 0 };
    }
    
    console.log(`Found ${alerts.length} active alerts`);
    
    // Track results
    const results = {
      matched: 0,
      emailed: 0,
      errors: 0
    };
    
    // For each alert, check if the job matches
    for (const alert of alerts as JobAlertData[]) {
      // Skip if user has no email
      if (!alert.User?.email) {
        console.log(`Skipping alert ${alert.id}: User has no email`);
        continue;
      }
      
      // Check if this job has already been sent for this alert
      const alreadySent = alert.JobAlertHistory?.some(h => h.jobId === job.id);
      if (alreadySent) {
        console.log(`Job ${job.id} already sent for alert ${alert.id}`);
        continue;
      }
      
      // Parse keywords from the alert
      const keywords = alert.keywords
        .split(',')
        .map((k: string) => k.trim().toLowerCase())
        .filter((k: string) => k.length > 0);
      
      // Create a searchable text from the job
      const jobText = `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase();
      
      // Check if any keyword matches
      const isMatching = keywords.some((keyword: string) => jobText.includes(keyword));
      
      if (isMatching) {
        results.matched++;
        console.log(`Job ${job.id} matches alert ${alert.id} for user ${alert.userId}`);
        
        try {
          // Send email notification
          await sendAlertEmail(alert, job);
          results.emailed++;
          
          // Record the match in history
          await supabase
            .from('JobAlertHistory')
            .insert({
              alertId: alert.id,
              jobId: job.id,
              sentAt: new Date().toISOString()
            });
        } catch (error: any) {
          console.error(`Error sending alert for job ${job.id} to user ${alert.userId}:`, error);
          results.errors++;
        }
      }
    }
    
    console.log(`Alert processing results for job ${job.id}:`, results);
    return results;
  } catch (error: any) {
    console.error('Error processing job alerts:', error);
    throw error;
  }
}

// Send an email notification for a matching job
async function sendAlertEmail(alert: JobAlertData, job: JobData): Promise<void> {
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