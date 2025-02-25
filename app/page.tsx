'use client';

import { useState, useEffect } from 'react';
import HeroSection from '@/components/ui/resume-matcher/hero-section';
import MatchingJobs from '@/components//ui/resume-matcher/matching-jobs';
import JobSearchFilters from '@/components//ui/resume-matcher/job-search-filters';
import { Job } from '@/types/job';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState({
    title: '',
    location: '',
    minSalary: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: currentPage.toString()
      });

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      setJobs(data.jobs);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters, currentPage]);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, title: query }));
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <main>
      
      <HeroSection onSearch={handleSearch} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <JobSearchFilters
              filters={filters}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {filters.title ? `Results for "${filters.title}"` : 'Latest Jobs'}
            </h2>
            <MatchingJobs 
              jobs={jobs}
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </main>
  );
}