// src/lib/matching/resume-matcher.ts
import { extractTechStack } from '../constants/tech-keywords';

interface ResumeData {
  text: string;
  techStack?: string[];
}

interface JobData {
  title: string;
  description: string;
  techStack: string[];
}

// Define experience levels and their keywords
const EXPERIENCE_LEVELS = {
  entry: ['entry level', 'junior', 'graduate', '0-2 years', 'entry-level'],
  mid: ['mid level', 'intermediate', '2-5 years', '3-5 years'],
  senior: ['senior', 'lead', 'architect', '5+ years', 'principal'],
};

export function calculateMatch(resume: ResumeData, job: JobData): {
  score: number;
  details: {
    techStackScore: number;
    titleRelevanceScore: number;
    experienceLevelMatch: string;
    matchingTechnologies: string[];
    missingTechnologies: string[];
  };
} {
  // Extract tech stack from resume if not provided
  const resumeTechStack = resume.techStack || extractTechStack(resume.text);
  
  // Convert arrays to Sets for easier operations
  const resumeTechs = new Set(resumeTechStack);
  const jobTechs = new Set(job.techStack);

  // Calculate matching and missing technologies
  const matchingTechs = [...resumeTechs].filter(tech => jobTechs.has(tech));
  const missingTechs = [...jobTechs].filter(tech => !resumeTechs.has(tech));

  // Calculate tech stack score (50% of total)
  const techStackScore = jobTechs.size > 0 
    ? (matchingTechs.length / jobTechs.size) * 50
    : 0;

  // Calculate title relevance score (30% of total)
  const titleRelevanceScore = calculateTitleRelevance(resume.text, job.title);

  // Determine experience level match (20% of total)
  const experienceScore = calculateExperienceMatch(resume.text, job.description);

  // Calculate final score
  const totalScore = Math.round(techStackScore + titleRelevanceScore + experienceScore);

  // Determine experience level match description
  const experienceLevel = determineExperienceLevel(job.description);

  return {
    score: Math.min(totalScore, 100), // Cap at 100
    details: {
      techStackScore: Math.round(techStackScore),
      titleRelevanceScore: Math.round(titleRelevanceScore),
      experienceLevelMatch: experienceLevel,
      matchingTechnologies: matchingTechs,
      missingTechnologies: missingTechs,
    }
  };
}

function calculateTitleRelevance(resumeText: string, jobTitle: string): number {
  const titleWords = jobTitle.toLowerCase().split(/\s+/);
  const relevantWords = titleWords.filter(word => 
    /\b(developer|engineer|programmer|architect|consultant)\b/.test(word)
  );

  let score = 0;
  relevantWords.forEach(word => {
    if (resumeText.toLowerCase().includes(word)) {
      score += 15; // Up to 30% from title match
    }
  });

  return Math.min(score, 30);
}

function calculateExperienceMatch(resumeText: string, jobDescription: string): number {
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();
  
  // Detect experience level from job description
  const jobLevel = determineExperienceLevel(jobDescription);
  
  // Detect experience level from resume
  let resumeLevel = 'entry';
  if (hasExperienceLevel(resumeLower, 'senior')) {
    resumeLevel = 'senior';
  } else if (hasExperienceLevel(resumeLower, 'mid')) {
    resumeLevel = 'mid';
  }

  // Score based on match
  if (jobLevel === resumeLevel) {
    return 20;
  } else if (
    (jobLevel === 'mid' && resumeLevel === 'senior') ||
    (jobLevel === 'entry' && resumeLevel !== 'entry')
  ) {
    return 15;
  }
  
  return 5;
}

function determineExperienceLevel(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (hasExperienceLevel(lowerText, 'senior')) {
    return 'senior';
  } else if (hasExperienceLevel(lowerText, 'mid')) {
    return 'mid';
  }
  return 'entry';
}

function hasExperienceLevel(text: string, level: keyof typeof EXPERIENCE_LEVELS): boolean {
  return EXPERIENCE_LEVELS[level].some(keyword => text.includes(keyword));
}