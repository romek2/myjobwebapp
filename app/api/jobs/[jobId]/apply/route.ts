// app/api/jobs/[jobId]/apply/route.ts - DEBUG VERSION
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  console.log('🚀 APPLICATION SUBMISSION STARTED');
  
  try {
    // Step 1: Check session
    const session = await getServerSession(authOptions);
    console.log('👤 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });

    if (!session?.user?.id) {
      console.log('❌ No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Parse URL and get jobId
    const url = new URL(req.url);
    const jobId = url.pathname.split('/')[3];
    console.log('🔗 URL parsing:', {
      fullUrl: req.url,
      pathname: url.pathname,
      pathSegments: url.pathname.split('/'),
      extractedJobId: jobId,
      jobIdType: typeof jobId
    });

    // Step 3: Initialize Supabase
    console.log('🗄️ Initializing Supabase...');
    const supabase = createServerSupabase();

    // Step 4: Test basic Supabase connection
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('jobs')
        .select('count')
        .limit(1);
      console.log('✅ Supabase connection test:', { testQuery, testError });
    } catch (testErr) {
      console.log('❌ Supabase connection failed:', testErr);
    }

    // Step 5: Parse form data
    console.log('📝 Parsing form data...');
    const formData = await req.formData();
    
    const coverLetter = formData.get('coverLetter') as string;
    const phone = formData.get('phone') as string;
    const desiredSalary = formData.get('desiredSalary') as string;
    const availableStartDate = formData.get('availableStartDate') as string;
    const linkedinUrl = formData.get('linkedinUrl') as string;
    const portfolioUrl = formData.get('portfolioUrl') as string;
    const resumeFile = formData.get('resume') as File;

    console.log('📋 Form data parsed:', {
      coverLetterLength: coverLetter?.length || 0,
      hasPhone: !!phone,
      hasSalary: !!desiredSalary,
      hasStartDate: !!availableStartDate,
      hasLinkedIn: !!linkedinUrl,
      hasPortfolio: !!portfolioUrl,
      hasResume: !!resumeFile,
      resumeSize: resumeFile?.size || 0,
      formDataKeys: Array.from(formData.keys())
    });

    // Step 6: Validate and convert jobId
    console.log('🔢 Processing job ID...');
    const jobIdInt = parseInt(jobId);
    console.log('Job ID conversion:', {
      original: jobId,
      converted: jobIdInt,
      isValid: !isNaN(jobIdInt)
    });

    if (isNaN(jobIdInt)) {
      console.log('❌ Invalid job ID');
      return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 });
    }

    // Step 7: Check if job exists
    console.log('🔍 Looking up job...');
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company, application_type, employer_email')
      .eq('id', jobIdInt)
      .single();

    console.log('📄 Job lookup result:', {
      job,
      jobError,
      errorCode: jobError?.code,
      errorMessage: jobError?.message
    });

    if (jobError || !job) {
      console.log('❌ Job not found');
      return NextResponse.json({ 
        error: 'Job not found',
        details: jobError?.message,
        jobId: jobIdInt
      }, { status: 404 });
    }

    // Step 8: Check application type
    console.log('🚪 Checking application type:', job.application_type);
    if (job.application_type === 'external') {
      console.log('❌ External only job');
      return NextResponse.json({ 
        error: 'This job only accepts external applications' 
      }, { status: 400 });
    }

    // Step 9: Check for duplicate application
    console.log('🔍 Checking for duplicate application...');
    const { data: existingApplication, error: duplicateError } = await supabase
      .from('user_job_applications')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('job_id', jobIdInt)
      .single();

    console.log('🔄 Duplicate check result:', {
      existingApplication,
      duplicateError,
      errorCode: duplicateError?.code
    });

    if (existingApplication) {
      console.log('❌ Duplicate application found');
      return NextResponse.json({ 
        error: 'You have already applied to this job' 
      }, { status: 409 });
    }

    // Step 10: Check current database schema
    console.log('🗂️ Checking table schema...');
    try {
      const { data: tableInfo, error: schemaError } = await supabase
        .rpc('check_table_columns', { table_name: 'user_job_applications' });
      console.log('Table schema check:', { tableInfo, schemaError });
    } catch (schemaErr) {
      console.log('Schema check failed (this is okay):', schemaErr);
    }

    // Step 11: Prepare application data
    console.log('📝 Preparing application data...');
    const applicationData = {
      user_id: session.user.id,
      job_id: jobIdInt,
      job_title: job.title,
      company: job.company,
      status: 'applied',
      applied_at: new Date().toISOString(),
      cover_letter: coverLetter,
      desired_salary: desiredSalary ? parseInt(desiredSalary) : null,
      available_start_date: availableStartDate || null,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl
      // Note: Removed phone since you reverted that column
    };

    console.log('📋 Application data prepared:', {
      ...applicationData,
      cover_letter: coverLetter ? `${coverLetter.substring(0, 50)}...` : null
    });

    // Step 12: Attempt database insert
    console.log('💾 Attempting database insert...');
    const { data: application, error } = await supabase
      .from('user_job_applications')
      .insert(applicationData)
      .select()
      .single();

    console.log('💾 Insert result:', {
      success: !!application,
      application,
      error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint
    });

    if (error) {
      console.log('❌ Database insert failed');
      return NextResponse.json({ 
        error: 'Failed to submit application',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('✅ Application created successfully!');
    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.applied_at
      }
    });

  } catch (error) {
    console.log('💥 Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}