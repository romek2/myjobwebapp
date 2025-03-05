'use client';

// app/jobs/[id]/page.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdvancedJobAnalysis from '@/components/AdvancedJobAnalysis';
import { getJobById } from '@/lib/services/jobs';
import { Job } from '@/types/job';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobDetails() {
      setLoading(true);
      try {
        const jobData = await getJobById(jobId);
        if (jobData) {
          setJob(jobData);
        } else {
          setError('Job not found');
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    }

    fetchJobDetails();
  }, [jobId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error || 'Job not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
      <div className="flex items-center text-gray-600 mb-6">
        <span className="font-medium mr-2">{job.company}</span>
        <span className="mx-2">•</span>
        <span>{job.location}</span>
      </div>

      {job.salary && (
        <div className="bg-green-50 text-green-800 inline-block px-3 py-1 rounded-full text-sm font-medium mb-6">
          {job.salary}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Job Description</h2>
        <p className="text-gray-700 mb-4">{job.description}</p>
        
        {job.techStack && job.techStack.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {job.techStack.map((tech: string) => (
                <span 
                  key={tech} 
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* This is our PRO-only feature */}
      <AdvancedJobAnalysis jobId={jobId} />
      
      <div className="flex justify-center mt-8">
        <a 
          href={job.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Apply Now
        </a>
      </div>
    </div>
  );
}