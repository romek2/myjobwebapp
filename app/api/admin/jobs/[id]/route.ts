// app/api/admin/jobs/[id]/route.ts - Individual job operations
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { hasProAccessServer } from '@/lib/subscription';
import { extractTechStack } from '@/lib/constants/tech-keywords';

// Helper to extract ID from the URL path
function getIdFromPath(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/');
  return segments[segments.length - 1];
}

// GET handler - fetch individual job
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check PRO access
    const hasProAccess = await hasProAccessServer(session.user.id);
    if (!hasProAccess) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }

    const jobId = getIdFromPath(request);
    const supabase = createServerSupabase();

    const { data: job, error } = await supabase
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
        application_type,
        employer_email,
        application_deadline,
        job_type,
        experience_level,
        benefits,
        created_at,
        job_tech(
          tech(id, name)
        )
      `)
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      return NextResponse.json(
        { error: error.code === 'PGRST116' ? 'Job not found' : `Database error: ${error.message}` },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/jobs/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT handler - update a job
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check PRO access
    const hasProAccess = await hasProAccessServer(session.user.id);
    if (!hasProAccess) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }

    const jobId = getIdFromPath(request);
    const body = await request.json();
    const {
      title,
      company,
      location,
      description,
      salary,
      job_type,
      experience_level,
      application_deadline,
      employer_email,
      benefits,
      application_type
    } = body;

    // Validate required fields
    if (!title || !company || !location || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, company, location, description' },
        { status: 400 }
      );
    }

    // Validate application type
    const validApplicationTypes = ['direct', 'external', 'both'];
    if (application_type && !validApplicationTypes.includes(application_type)) {
      return NextResponse.json(
        { error: 'Invalid application_type. Must be: direct, external, or both' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    // Check if job exists
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.code === 'PGRST116' ? 'Job not found' : 'Database error' },
        { status: fetchError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    // Extract tech stack from title and description
    const titleAndDescription = `${title} ${description}`;
    const techStack = extractTechStack(titleAndDescription);

    // Update the job
    const updateData = {
      title,
      company,
      location,
      description,
      salary: salary || null,
      application_type: application_type || 'direct',
      employer_email: employer_email || null,
      application_deadline: application_deadline || null,
      job_type: job_type || 'Full-time',
      experience_level: experience_level || 'Mid',
      benefits: benefits || []
    };

    const { data: job, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating job:', updateError);
      return NextResponse.json(
        { error: `Database error: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Update tech stack relationships
    // First, remove existing relationships
    await supabase
      .from('job_tech')
      .delete()
      .eq('job_id', jobId);

    // Then add new relationships
    for (const techName of techStack) {
      try {
        // Find or create tech
        let { data: techData, error: techError } = await supabase
          .from('tech')
          .select('id')
          .eq('name', techName)
          .maybeSingle();

        let techId;

        if (techError) {
          console.error(`Error finding tech ${techName}:`, techError);
          continue;
        }

        if (techData) {
          techId = techData.id;
        } else {
          // Create tech
          const { data: newTech, error: createTechError } = await supabase
            .from('tech')
            .insert({ name: techName })
            .select()
            .single();

          if (createTechError) {
            console.error(`Error creating tech ${techName}:`, createTechError);
            continue;
          }

          techId = newTech.id;
        }

        // Create job-tech relationship
        await supabase
          .from('job_tech')
          .insert({
            job_id: jobId,
            tech_id: techId
          });

      } catch (techError) {
        console.error(`Error processing tech ${techName}:`, techError);
      }
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Unexpected error in PUT /api/admin/jobs/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE handler - delete a job
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check PRO access
    const hasProAccess = await hasProAccessServer(session.user.id);
    if (!hasProAccess) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }

    const jobId = getIdFromPath(request);
    const supabase = createServerSupabase();

    // Check if job exists
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.code === 'PGRST116' ? 'Job not found' : 'Database error' },
        { status: fetchError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    // Delete the job (this will cascade delete related records due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (deleteError) {
      console.error('Error deleting job:', deleteError);
      return NextResponse.json(
        { error: `Database error: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Job "${existingJob.title}" deleted successfully` 
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/jobs/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}