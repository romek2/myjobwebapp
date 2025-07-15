import React from 'react';
import { Job } from '@/types/job';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Eye, ExternalLink, Send } from 'lucide-react';
import { useJobActions } from '@/hooks/useJobActions';
import { useRouter } from 'next/navigation';

interface MatchingJobsProps {
  jobs: Job[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MatchingJobs: React.FC<MatchingJobsProps> = ({ 
  jobs, 
  isLoading,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const { handleJobView, handleJobApply } = useJobActions();
  const router = useRouter();

  const handleInternalApply = (job: Job) => {
    // For internal jobs, navigate to internal application page
    router.push(`/jobs/${job.id}/apply`);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Loading jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <svg className="h-12 w-12 mx-auto text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-4">
            No jobs matching your criteria were found. Try adjusting your search filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Found Jobs ({jobs.length})</h2>
      
      {jobs.map((job) => (
        <Card key={job.id} className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  {/* Show job type badge */}
                  {job.job_type === 'internal' && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                      Direct Apply
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Company:</span> {job.company}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {job.location}
                  </p>
                  {job.salary && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Salary:</span> {job.salary}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-sm">
                    {job.match > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        {job.match}% Match
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600">
                  Posted {new Date(job.postedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="mt-3">
              <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
              
              {/* ✅ Different buttons based on job type */}
              <div className="flex gap-3 mt-4">
                
                {job.job_type === 'external' ? (
                  // External jobs: Only "View Job" button
                  <button
                    onClick={() => handleJobView(job.id.toString())}
                    className="inline-flex items-center text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Job
                  </button>
                ) : (
                  // Internal jobs: Both "View Details" and "Apply Now" buttons
                  <>
                    <button
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    
                    <button
                      onClick={() => handleInternalApply(job)}
                      className="inline-flex items-center text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Apply Now
                    </button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            size="sm"
          >
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatchingJobs;