'use client';

import { useState, useEffect } from 'react';
import HeroSection from '@/components/ui/resume-matcher/hero-section';
import MatchingJobs from '@/components/ui/resume-matcher/matching-jobs';
import JobSearchFilters from '@/components/ui/resume-matcher/job-search-filters';
import { Job } from '@/types/job';
import { Sparkles, TrendingUp, Zap, ArrowRight } from 'lucide-react';

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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section with enhanced styling */}
      <div className="relative">
        <HeroSection onSearch={handleSearch} />
      </div>
      
      {/* Main Content with glassmorphism */}
      <div className="relative container-responsive py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Filters Sidebar with cool styling */}
            <aside className="w-full lg:w-80 lg:flex-shrink-0">
              <div className="sticky top-24">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/5 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Smart Filters</h2>
                  </div>
                  <JobSearchFilters
                    filters={filters}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
            </aside>
            
            {/* Job Results with enhanced styling */}
            <section className="flex-1 min-w-0">
              {/* Results Header with modern design */}
              <div className="mb-8">
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg shadow-black/5 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                          {filters.title ? `Results for "${filters.title}"` : 'Latest Tech Jobs'}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1 flex items-center">
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                              Searching...
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                {jobs.length} jobs
                              </span>
                              found and ready for you
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Additional action button */}
                    <div className="flex items-center space-x-3">
                      <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <Zap className="w-4 h-4 mr-2" />
                        Quick Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Job Listings with enhanced container */}
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-black/5 overflow-hidden">
                <MatchingJobs 
                  jobs={jobs}
                  isLoading={isLoading}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
      
      {/* Enhanced Footer CTA Section */}
      {!isLoading && jobs.length === 0 && !filters.title && (
        <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 overflow-hidden">
          {/* Animated background */}
          <div>
          <div className="absolute inset-0 opacity-30" style={{
  backgroundImage: `url("data:image/svg+xml,<svg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'><g fill='white' fill-opacity='0.05'><path d='M0 0h40v40H0V0zm20 20a20 20 0 1 1 0-40 20 20 0 0 1 0 40z'/></g></svg>")`
}}></div>
          
          <div className="relative container-responsive py-16 sm:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Your Journey Today
              </div>
              
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
                Ready to find your 
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> dream job?</span>
              </h2>
              
              <p className="text-blue-200 mb-10 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                Join thousands of developers who've found their perfect match. 
                Get personalized job recommendations powered by AI.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <button 
                  onClick={() => handleSearch('software engineer')}
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
                >
                  <span className="mr-2">Browse Software Jobs</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                
                <button 
                  onClick={() => handleSearch('remote')}
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                >
                  <span className="mr-2">Find Remote Work</span>
                  <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                </button>
              </div>
              
              {/* Stats section */}
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                {[
                  { number: '10K+', label: 'Active Jobs' },
                  { number: '500+', label: 'Companies' },
                  { number: '95%', label: 'Success Rate' }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.number}</div>
                    <div className="text-blue-200 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </section>
      )}
    </main>
  );
}