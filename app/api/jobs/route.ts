// src/app/api/jobs/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { extractTechStack } from '@/lib/constants/tech-keywords';

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