// src/components/resume-matcher.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Job } from '@/types/job';
import ResumeUpload from './resume-upload';
import JobSearchFilters from './job-search-filters';
import MatchingJobs from './matching-jobs';

interface ResumeData {
  text: string;
  techStack: string[];
}

export default function ResumeMatcher() {
  const [step, setStep] = useState(1);
  const [resume, setResume] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    title: '',
    location: '',
    minSalary: ''
  });

  const handleResumeUpload = (file: File, data: ResumeData) => {
    setResume(file);
    setResumeData(data);
    setStep(2);
  };

  const handleJobSearch = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        title: filters.title,
        location: filters.location,
        minSalary: filters.minSalary,
        page: currentPage.toString()
      });

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    handleJobSearch();
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    handleJobSearch();
  };

  return (
    <div className="space-y-4">
      <ResumeUpload 
        onFileUpload={handleResumeUpload} 
        step={step}
      />

      {step >= 2 && (
        <>
          {resumeData && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold">Detected Technologies:</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {resumeData.techStack.map((tech) => (
                  <span 
                    key={tech}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          <JobSearchFilters
            filters={filters}
            onChange={handleFilterChange}
          />
        </>
      )}

      <Button 
        onClick={() => handleJobSearch()} 
        className="w-full"
        disabled={step < 2}
      >
        <Search className="mr-2 h-4 w-4" /> Search Jobs
      </Button>

      <MatchingJobs 
        jobs={jobs} 
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}