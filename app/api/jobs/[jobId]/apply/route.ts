// app/api/jobs/[jobId]/apply/route.ts - COMPLETE FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { applicationEmailService } from '@/lib/services/applicationEmailService';
import { notificationService } from '@/lib/services/notificationService';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get jobId from URL path
    const url = new URL(req.url);
    const jobId = url.pathname.split('/')[3]; // /api/jobs/[jobId]/apply

    // 🔍 Debug logging
    console.log('🔍 APPLICATION DEBUG:');
    console.log('Raw jobId from URL:', jobId);
    console.log('jobId type:', typeof jobId);
    console.log('User ID:', session.user.id);

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

    // Convert jobId to integer (your jobs table uses integer IDs)
    const jobIdInt = parseInt(jobId);
    if (isNaN(jobIdInt)) {
      console.log('❌ Invalid job ID - not a number:', jobId);
      return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 });
    }

    console.log('✅ Converted jobId to integer:', jobIdInt);

    // Get job details with integer ID
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company, application_type, employer_email')
      .eq('id', jobIdInt)
      .single();

    console.log('Job lookup result:', { job, jobError });

    if (jobError || !job) {
      console.log('❌ Job not found with ID:', jobIdInt);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log('✅ Job found:', job.title, 'at', job.company);

    // Check if job allows direct applications
    if (job.application_type === 'external') {
      return NextResponse.json({ 
        error: 'This job only accepts external applications' 
      }, { status: 400 });
    }

    // Check for duplicate application using integer job_id
    const { data: existingApplication } = await supabase
      .from('user_job_applications')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('job_id', jobIdInt)
      .single();

    if (existingApplication) {
      console.log('❌ Duplicate application found');
      return NextResponse.json({ 
        error: 'You have already applied to this job' 
      }, { status: 409 });
    }

    console.log('✅ No duplicate application found');

    // Handle resume upload if provided
    let resumeFileUrl = null;
    let resumeFilename = null;

    if (resumeFile && resumeFile.size > 0) {
      try {
        console.log('📎 Processing resume upload:', resumeFile.name, resumeFile.size, 'bytes');
        
        // Upload to Supabase Storage
        const fileName = `applications/${session.user.id}/${jobIdInt}/${Date.now()}-${resumeFile.name}`;
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
          console.log('✅ Resume uploaded successfully:', fileName);

          // Also save/update in user_resumes table for future use
          await saveToUserResumes(supabase, session.user.id, resumeFile, fileName, publicUrl);
        } else {
          console.error('❌ Resume upload error:', uploadError);
          // Continue with application even if resume upload fails
        }
      } catch (uploadError) {
        console.error('❌ Resume upload exception:', uploadError);
        // Continue with application even if resume upload fails
      }
    }

    // Prepare application data
    const applicationData = {
      user_id: session.user.id,
      job_id: jobIdInt, // ✅ Use integer job ID
      job_title: job.title,
      company: job.company,
      status: 'applied', // This should work with your updated constraint
      applied_at: new Date().toISOString(),
      cover_letter: coverLetter,
      resume_file_url: resumeFileUrl,
      resume_filename: resumeFilename,
      desired_salary: desiredSalary ? parseInt(desiredSalary) : null,
      available_start_date: availableStartDate || null,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl,
      phone: phone
    };

    console.log('📝 Creating application with data:', {
      ...applicationData,
      cover_letter: coverLetter ? `${coverLetter.substring(0, 50)}...` : null
    });

    // Create the application record
    const { data: application, error } = await supabase
      .from('user_job_applications')
      .insert(applicationData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating application:', error);
      return NextResponse.json({ 
        error: 'Failed to submit application',
        details: error.message,
        hint: error.hint 
      }, { status: 500 });
    }

    console.log('✅ Application created successfully:', application.id);

    // Send enhanced email notification to employer if email is provided
    if (job.employer_email) {
      try {
        await applicationEmailService.sendApplicationToEmployer({
          employerEmail: job.employer_email,
          jobTitle: job.title,
          company: job.company,
          jobId: jobIdInt.toString(),
          applicationId: application.id.toString(),
          applicantName: session.user.name || session.user.email || 'Anonymous',
          applicantEmail: session.user.email || '',
          coverLetter,
          resumeUrl: resumeFileUrl,
          desiredSalary,
          availableStartDate,
          linkedinUrl,
          portfolioUrl,
          phone
        });
        console.log(`✅ Enhanced email sent to employer: ${job.employer_email}`);
      } catch (emailError) {
        console.error('❌ Failed to send employer notification:', emailError);
        // Don't fail the application if email fails
      }
    }

    // Send confirmation email to applicant
    try {
      await applicationEmailService.sendApplicationConfirmation(
        session.user.email || '',
        session.user.name || session.user.email?.split('@')[0] || 'User',
        job.title,
        job.company
      );
      console.log('✅ Confirmation email sent to applicant');
    } catch (confirmationError) {
      console.error('❌ Failed to send application confirmation:', confirmationError);
      // Don't fail the application if confirmation email fails
    }

    // Create initial notification for the user
    try {
      await notificationService.createNotification({
        userId: session.user.id,
        applicationId: application.id.toString(),
        type: 'status_update',
        title: `Application Submitted - ${job.title}`,
        message: `Your application for ${job.title} at ${job.company} has been successfully submitted.`,
        requiresPro: false, // Application confirmation doesn't require PRO
        metadata: {
          status: 'applied',
          jobTitle: job.title,
          company: job.company
        }
      });
      console.log('✅ Initial notification created');
    } catch (notificationError) {
      console.error('❌ Failed to create notification:', notificationError);
      // Don't fail the application if notification creation fails
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
    console.error('💥 Error processing application:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
      file_size: file.size,
      file_type: file.type,
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

    console.log('✅ Resume saved to user_resumes table');
  } catch (error) {
    console.error('❌ Error saving to user_resumes:', error);
    // Don't fail the application if this fails
  }
}