// types/index.ts - CORRECTED VERSION
export interface Skill {
  id: number;  // ✅ Changed to number (matches your SERIAL database field)
  user_id: string;
  name: string;
  category: 'programming' | 'framework' | 'tool' | 'soft' | 'other';
  created_at: string;
}

export interface UserProfile {
  skills: Skill[];
  experience_level: 'entry' | 'mid' | 'senior' | 'lead';  // ✅ Fixed snake_case
  preferred_location: 'remote' | 'hybrid' | 'onsite' | 'no-preference';  // ✅ Fixed snake_case
  salary_min?: number;  // ✅ Fixed snake_case
  salary_max?: number;  // ✅ Fixed snake_case
  job_types: string[];  // ✅ Fixed snake_case
}

export interface Resume {
  id: number;
  user_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  text_content: string;
  ats_score: number;
  tech_stack: string[];
  insights: any[];
  created_at: string;
  updated_at: string;
}

export interface JobAlert {
  id: string;
  userId: string;
  name: string;
  keywords: string;
  frequency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedDate: string;
  location: string;
}