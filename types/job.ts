// types/job.ts - Update
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  source: string;
  postedAt: Date;
  techStack: string[];
  match: number;
  job_type?: 'external' | 'internal';
  application_type?: 'external' | 'direct' | 'both'; // Add this
  matchDetails?: {
    techStackScore: number;
    titleRelevanceScore: number;
    experienceLevelMatch: string;
    matchingTechnologies: string[];
    missingTechnologies: string[];
  };
}