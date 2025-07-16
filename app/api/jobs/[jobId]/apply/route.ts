// app/api/jobs/[jobId]/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.jobId;
    const formData = await request.formData();
    
    // Extract form data
    const coverLetter = formData.get('coverLetter') as string;
    const phone = formData.get('phone') as string;
    const desiredSalary = formData.get('desiredSalary') as string;
    const availableStartDate = formData.get('availableStartDate') as string;
    const linkedinUrl = formData.get('linkedinUrl') as string;
    const portfolioUrl = formData.get('portfolioUrl') as string;
    const resumeFile = formData.get('resume') as File;

    const supabase = createServerSupabase();

    // 1. Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('title, company, application_type')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.application_type === 'external') {
      return NextResponse.json({ 
        error: 'This job only accepts external applications' 
      }, { status: 400 });
    }

    // 2. Check if user already applied using your existing table
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

    // 3. Upload resume to Supabase Storage (if provided)
    let resumeFileUrl = null;
    let resumeFilename = null;

    if (resumeFile && resumeFile.size > 0) {
      const fileExtension = resumeFile.name.split('.').pop();
      const fileName = `${session.user.id}/${jobId}/${Date.now()}.${fileExtension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile, {
          contentType: resumeFile.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Resume upload error:', uploadError);
        return NextResponse.json({ 
          error: 'Failed to upload resume' 
        }, { status: 500 });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      resumeFileUrl = publicUrl;
      resumeFilename = resumeFile.name;
    }

    // 4. Create application record using your existing user_job_applications table
    const { data: application, error: appError } = await supabase
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
        portfolio_url: portfolioUrl,
        application_url: request.headers.get('referer') || null
      })
      .select()
      .single();

    if (appError) {
      console.error('Application creation error:', appError);
      return NextResponse.json({ 
        error: 'Failed to submit application' 
      }, { status: 500 });
    }

    // 5. Send notification emails (optional)
    await sendApplicationNotifications(application, job);

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.applied_at
      }
    });

  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper function for notifications
async function sendApplicationNotifications(application: any, job: any) {
  // TODO: Implement email notifications
  // - Send confirmation to applicant
  // - Send notification to employer (if internal job)
  console.log(`Application ${application.id} submitted for ${job.title}`);
}