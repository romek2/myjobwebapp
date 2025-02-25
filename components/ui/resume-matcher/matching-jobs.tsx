// src/components/matching-jobs.tsx
import React from 'react';
import { Job } from '@/types/job';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32"></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No jobs found. Try adjusting your search filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                <p className="text-gray-600">{job.company}</p>
              </div>
              {job.salary && (
                <span className="text-green-600 font-medium">{job.salary}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
              <span>{job.location}</span>
              <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-700 line-clamp-2 mb-4">{job.description}</p>
            
            {/* Tech Stack */}
            {job.techStack && job.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {job.techStack.map((tech) => (
                  <span 
                    key={tech} 
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => window.open(job.url, '_blank')}
              >
                View Job
              </Button>
              {job.match > 0 && (
                <span className="text-sm">
                  <span className="font-medium">{job.match}%</span> Match
                </span>
              )}
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
          >
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatchingJobs;