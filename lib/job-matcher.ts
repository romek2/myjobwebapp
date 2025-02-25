import { Job } from '@/types/job';

const mockJobs: Job[] = [
  { 
    title: 'Software Engineer', 
    company: 'Tech Corp', 
    location: 'San Francisco, CA', 
    salary: '$120,000 - $150,000',
    match: 85
  },
  { 
    title: 'Data Scientist', 
    company: 'Data Insights Inc', 
    location: 'New York, NY', 
    salary: '$110,000 - $140,000',
    match: 72
  }
];

export function searchJobs(title: string, location: string, minSalary: string): Job[] {
  return mockJobs.filter(job => 
    (!title || job.title.toLowerCase().includes(title.toLowerCase())) &&
    (!location || job.location.toLowerCase().includes(location.toLowerCase().trim())) &&
    (!minSalary || parseInt(job.salary.replace(/[^0-9]/g, '')) >= parseInt(minSalary) || !parseInt(minSalary))
  );
}