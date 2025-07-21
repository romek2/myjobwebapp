// app/api/admin/jobs/route.ts - Main jobs API route
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { hasProAccessServer } from '@/lib/subscription';
import { extractTechStack } from '@/lib/constants/tech-keywords';
import { v4 as uuidv4 } from 'uuid';

// GET handler - fetch all jobs for admin
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

    const supabase = createServerSupabase();

    // Get URL parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const applicationFilter = searchParams.get('application_type') || '';

    // Build the query
    let query = supabase
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
        created_at
      `)
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,location.ilike.%${search}%`);
    }

    // Apply application type filter
    if (applicationFilter && applicationFilter !== 'all') {
      query = query.eq('application_type', applicationFilter);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('jobs')
      .select('id', { count: 'exact' });

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,company.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (applicationFilter && applicationFilter !== 'all') {
      countQuery = countQuery.eq('application_type', applicationFilter);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting jobs:', countError);
      return NextResponse.json(
        { error: `Database error: ${countError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobs: jobs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/jobs:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST handler - create a new job
export async function POST(request: NextRequest) {
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

    // Extract tech stack from title and description
    const titleAndDescription = `${title} ${description}`;
    const techStack = extractTechStack(titleAndDescription);

    // Create the job
    const jobData = {
      title,
      company,
      location,
      description,
      url: `${process.env.NEXTAUTH_URL}/jobs/${uuidv4()}`, // Generate internal URL
      source: 'Internal',
      posted_at: new Date().toISOString(),
      salary: salary || null,
      application_type: application_type || 'direct',
      employer_email: employer_email || null,
      application_deadline: application_deadline || null,
      job_type: job_type || 'Full-time',
      experience_level: experience_level || 'Mid',
      benefits: benefits || []
    };

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json(
        { error: `Database error: ${jobError.message}` },
        { status: 500 }
      );
    }

    // Create tech stack relationships
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
            job_id: job.id,
            tech_id: techId
          });

      } catch (techError) {
        console.error(`Error processing tech ${techName}:`, techError);
      }
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/jobs:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}