// src/types/resume.ts

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  location?: string;
}

export interface Education {
  degree: string;
  school: string;
  startYear?: number;
  endYear?: number;
  gpa?: number;
  major?: string;
  minor?: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  responsibilities: string[];
  location?: string;
}

export interface Skill {
  name: string;
  category: string;
  yearsOfExperience?: number;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ParsedResume {
  contact: ContactInfo;
  education: Education[];
  experience: WorkExperience[];
  skills: Skill[];
  rawText: string;
}