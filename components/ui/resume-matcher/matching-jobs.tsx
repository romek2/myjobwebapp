// src/components/ui/resume-matcher/matching-jobs.tsx
import React from 'react';
import { Job } from '@/types/job';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink, PauseCircle, PlayCircle } from 'lucide-react';
import Link from 'next/link';

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
                <h3 className="font-semibold text-lg">{job.title}</h3>
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
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                      Posted {new Date(job.postedAt).toLocaleDateString()}
                    </span>
                    {job.match > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        {job.match}% Match
                      </span>
                    )}
                  </div>
                </div>


              </div>
              <div className="flex space-x-2">
                <Link href={`/jobs/${job.id}`} passHref>
                  <Button
                    variant="outline"
                    size="sm"
                    title="View job details"
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(job.url, '_blank')}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Apply for job"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-3">
              <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
              <Link href={`/jobs/${job.id}`} className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                View full details
              </Link>
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