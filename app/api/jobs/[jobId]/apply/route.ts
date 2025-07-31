// app/api/jobs/[jobId]/apply/route.ts - Updated to send employer emails
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

interface EmployerNotificationData {
  employerEmail: string;
  jobTitle: string;
  company: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter?: string;
  resumeUrl?: string | null;
  desiredSalary?: string;
  availableStartDate?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  applicationId: string;
}

// Function to send email notification to employer
async function sendEmployerNotification(data: EmployerNotificationData) {
  const {
    employerEmail,
    jobTitle,
    company,
    applicantName,
    applicantEmail,
    coverLetter,
    resumeUrl,
    desiredSalary,
    availableStartDate,
    linkedinUrl,
    portfolioUrl,
    applicationId
  } = data;

  // Create email content
  const emailSubject = `New Application: ${jobTitle} at ${company}`;
  
  const emailText = `
New Job Application Received

Position: ${jobTitle}
Company: ${company}
Application ID: ${applicationId}

APPLICANT INFORMATION:
Name: ${applicantName}
Email: ${applicantEmail}
${desiredSalary ? `Desired Salary: ${parseInt(desiredSalary).toLocaleString()}` : ''}
${availableStartDate ? `Available Start Date: ${new Date(availableStartDate).toLocaleDateString()}` : ''}
${linkedinUrl ? `LinkedIn: ${linkedinUrl}` : ''}
${portfolioUrl ? `Portfolio: ${portfolioUrl}` : ''}

COVER LETTER:
${coverLetter || 'No cover letter provided.'}

${resumeUrl ? `RESUME: ${resumeUrl}` : 'No resume attached.'}

---
This application was submitted through JobMatcher.
Reply directly to this email to contact the applicant.
  `;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4a6cf7; border-bottom: 2px solid #4a6cf7; padding-bottom: 10px;">
        New Job Application
      </h2>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Position Details</h3>
        <p style="margin: 5px 0;"><strong>Job Title:</strong> ${jobTitle}</p>
        <p style="margin: 5px 0;"><strong>Company:</strong> ${company}</p>
        <p style="margin: 5px 0;"><strong>Application ID:</strong> ${applicationId}</p>
      </div>

      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Applicant Information</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${applicantName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${applicantEmail}">${applicantEmail}</a></p>
        ${desiredSalary ? `<p style="margin: 5px 0;"><strong>Desired Salary:</strong> ${parseInt(desiredSalary).toLocaleString()}</p>` : ''}
        ${availableStartDate ? `<p style="margin: 5px 0;"><strong>Available Start Date:</strong> ${new Date(availableStartDate).toLocaleDateString()}</p>` : ''}
        ${linkedinUrl ? `<p style="margin: 5px 0;"><strong>LinkedIn:</strong> <a href="${linkedinUrl}" target="_blank">${linkedinUrl}</a></p>` : ''}
        ${portfolioUrl ? `<p style="margin: 5px 0;"><strong>Portfolio:</strong> <a href="${portfolioUrl}" target="_blank">${portfolioUrl}</a></p>` : ''}
      </div>

      ${coverLetter ? `
        <div style="background-color: #f1f8e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Cover Letter</h3>
          <div style="background-color: white; padding: 15px; border-radius: 3px; white-space: pre-wrap;">${coverLetter}</div>
        </div>
      ` : ''}

      ${resumeUrl ? `
        <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Resume</h3>
          <p><a href="${resumeUrl}" target="_blank" style="color: #4a6cf7; font-weight: bold;">📄 Download Resume</a></p>
        </div>
      ` : ''}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        <p>This application was submitted through JobMatcher.</p>
        <p>Reply directly to this email to contact the applicant at ${applicantEmail}</p>
      </div>
    </div>
  `;

  // Send the email
  const msg = {
    to: employerEmail,
    from: process.env.SENDGRID_FROM_EMAIL as string,
    replyTo: applicantEmail, // So employer can reply directly to applicant
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
  };

  await sgMail.send(msg);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get jobId from URL path
    const url = new URL(req.url);
    const jobId = url.pathname.split('/')[3]; // /api/jobs/[jobId]/apply

    const supabase = createServerSupabase();

    // Get form data
    const formData = await req.formData();
    
    // Extract form fields
    const coverLetter = formData.get('coverLetter') as string;
    const phone = formData.get('phone') as string;
    const desiredSalary = formData.get('desiredSalary') as string;
    const availableStartDate = formData.get('availableStartDate') as string;
    const linkedinUrl = formData.get('linkedinUrl') as string;
    const portfolioUrl = formData.get('portfolioUrl') as string;
    const resumeFile = formData.get('resume') as File;

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('title, company, application_type, employer_email')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if job allows direct applications
    if (job.application_type === 'external') {
      return NextResponse.json({ 
        error: 'This job only accepts external applications' 
      }, { status: 400 });
    }

    // Check for duplicate application
    const { data: existingApplication } = await supabase
      .from('user_job_applications')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('job_id', jobId)
      .single();

    if (existingApplication) {
      return NextResponse.json({ 
        error: 'You have already applied to this job' 
      }, { status: 409 });
    }

    // Handle resume upload if provided
    let resumeFileUrl = null;
    let resumeFilename = null;

    if (resumeFile && resumeFile.size > 0) {
      try {
        // Upload to Supabase Storage
        const fileName = `applications/${session.user.id}/${jobId}/${Date.now()}-${resumeFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile, {
            contentType: resumeFile.type,
            upsert: false
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(fileName);
          
          resumeFileUrl = publicUrl;
          resumeFilename = resumeFile.name;

          // Also save/update in user_resumes table for future use
          await saveToUserResumes(supabase, session.user.id, resumeFile, fileName, publicUrl);
        } else {
          console.error('Resume upload error:', uploadError);
          // Continue with application even if resume upload fails
        }
      } catch (uploadError) {
        console.error('Resume upload error:', uploadError);
        // Continue with application even if resume upload fails
      }
    }

    // Create the application record
    const { data: application, error } = await supabase
      .from('user_job_applications')
      .insert({
        user_id: session.user.id,
        job_id: jobId,
        job_title: job.title,
        company: job.company,
        status: 'applied',
        applied_at: new Date().toISOString(),
        cover_letter: coverLetter,
        resume_file_url: resumeFileUrl,
        resume_filename: resumeFilename,
        desired_salary: desiredSalary ? parseInt(desiredSalary) : null,
        available_start_date: availableStartDate || null,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    // Send email notification to employer if email is provided
    if (job.employer_email) {
      try {
        await sendEmployerNotification({
          employerEmail: job.employer_email,
          jobTitle: job.title,
          company: job.company,
          applicantName: session.user.name || session.user.email || 'Anonymous',
          applicantEmail: session.user.email || '',
          coverLetter,
          resumeUrl: resumeFileUrl,
          desiredSalary,
          availableStartDate,
          linkedinUrl,
          portfolioUrl,
          applicationId: application.id
        });
        console.log(`Email sent to employer: ${job.employer_email}`);
      } catch (emailError) {
        console.error('Failed to send employer notification:', emailError);
        // Don't fail the application if email fails
      }
    }

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.applied_at
      }
    });

  } catch (error) {
    console.error('Error processing application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to save resume to user_resumes table
async function saveToUserResumes(
  supabase: any, 
  userId: string, 
  file: File, 
  fileName: string, 
  publicUrl: string
) {
  try {
    // Basic text extraction (simplified)
    const text = `Resume: ${file.name}. Size: ${file.size} bytes.`;
    
    // Check if user already has a resume
    const { data: existingResume } = await supabase
      .from('user_resumes')
      .select('id')
      .eq('user_id', userId)
      .single();

    const resumeRecord = {
      user_id: userId,
      filename: fileName,
      original_filename: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: publicUrl,
      text_content: text,
      tech_stack: [], // Could extract tech stack here
      ats_score: 75, // Default score
      insights: [],
      updated_at: new Date().toISOString()
    };

    if (existingResume) {
      // Update existing resume
      await supabase
        .from('user_resumes')
        .update(resumeRecord)
        .eq('id', existingResume.id);
    } else {
      // Create new resume record
      await supabase
        .from('user_resumes')
        .insert({
          ...resumeRecord,
          created_at: new Date().toISOString()
        });
    }

    console.log('Resume saved to user_resumes table');
  } catch (error) {
    console.error('Error saving to user_resumes:', error);
    // Don't fail the application if this fails
  }
}