// app/api/jobs/[jobId]/apply/route.ts - Updated to save resume properly
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

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
      .select('title, company, application_type')
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