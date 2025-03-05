// src/lib/services/jobs.ts
import { getSupabase } from '../supabase';
import { Job } from '@/types/job';
import { extractTechStack } from '@/lib/constants/tech-keywords';

const supabase = getSupabase();

/**
 * Search for jobs using the API
 */
export async function searchJobs(title: string, location: string, minSalary: string, techStack: string[] = [], page: number = 1) {
  const params = new URLSearchParams();
  if (title) params.append('title', title);
  if (location) params.append('location', location);
  if (minSalary) params.append('minSalary', minSalary);
  if (techStack.length > 0) params.append('techStack', techStack.join(','));
  params.append('page', page.toString());

  const response = await fetch(`/api/jobs?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }
  return response.json();
}

/**
 * Get job by ID directly from Supabase
 */
export async function getJobById(id: string): Promise<Job | null> {
  try {
    // Fetch the job record
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
        job_tech(
          tech(id, name)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !job) {
      console.error('Error fetching job:', error);
      return null;
    }
    
    // Extract tech stack from both the job_tech relation and description
    const descriptionTechStack = extractTechStack(job.description);
    const storedTechStack = job.job_tech
      ? job.job_tech.map((jt: any) => jt.tech?.name).filter(Boolean)
      : [];
    
    // Combine and deduplicate tech stack
    const combinedTechStack = Array.from(new Set([...storedTechStack, ...descriptionTechStack]));
    
    // Format the job data to match the Job interface
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      url: job.url,
      source: job.source,
      postedAt: new Date(job.posted_at),
      salary: job.salary,
      techStack: combinedTechStack,
      match: 0
    };
  } catch (error) {
    console.error('Error getting job by ID:', error);
    return null;
  }
}

/**
 * Get all available tech options
 */
export async function getAllTechOptions(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('tech')
      .select('name')
      .order('name');
    
    if (error) {
      console.error('Error fetching tech options:', error);
      return [];
    }
    
    return data.map(tech => tech.name);
  } catch (error) {
    console.error('Error getting tech options:', error);
    return [];
  }
}