'use client';

import { useState, useEffect } from 'react';
import HeroSection from '@/components/ui/resume-matcher/hero-section';
import MatchingJobs from '@/components/ui/resume-matcher/matching-jobs';
import JobSearchFilters from '@/components/ui/resume-matcher/job-search-filters';
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
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection onSearch={handleSearch} />
      
      {/* Main Content */}
      <div className="container-responsive py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Filters Sidebar */}
            <aside className="w-full lg:w-80 lg:flex-shrink-0">
              <div className="sticky top-6">
                <JobSearchFilters
                  filters={filters}
                  onChange={handleFilterChange}
                />
              </div>
            </aside>
            
            {/* Job Results */}
            <section className="flex-1 min-w-0">
              {/* Results Header */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                      {filters.title ? `Results for "${filters.title}"` : 'Latest Tech Jobs'}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      {isLoading ? 'Searching...' : `${jobs.length} jobs found`}
                    </p>
                  </div>
                  
                  {/* Quick Stats */}
                  {!isLoading && jobs.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        Remote: {jobs.filter(job => job.location.toLowerCase().includes('remote')).length}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        With Salary: {jobs.filter(job => job.salary).length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Job Listings */}
              <MatchingJobs 
                jobs={jobs}
                isLoading={isLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </section>
          </div>
        </div>
      </div>
      
      {/* Footer CTA Section */}
      {!isLoading && jobs.length === 0 && !filters.title && (
        <section className="bg-white border-t">
          <div className="container-responsive py-12 sm:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Ready to find your dream job?
              </h2>
              <p className="text-gray-600 mb-8 text-sm sm:text-base">
                Upload your resume to get personalized job matches and AI-powered recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => handleSearch('software engineer')}
                  className="btn-primary"
                >
                  Browse Software Jobs
                </button>
                <button 
                  onClick={() => handleSearch('remote')}
                  className="btn-secondary"
                >
                  Find Remote Work
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}