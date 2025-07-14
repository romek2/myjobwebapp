// hooks/useJobTracking.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface JobApplication {
  id: number;
  job_id: string;
  job_title: string;
  company: string;
  applied_at: string;
  application_url?: string;
  status: string;
  notes?: string;
}

interface JobView {
  id: number;
  job_id: string;
  viewed_at: string;
  source: string;
  Job?: {
    title: string;
    company: string;
    location: string;
  };
}

interface JobActivity {
  applications: JobApplication[];
  views: JobView[];
  stats: {
    totalApplications: number;
    totalViews: number;
  };
}

export function useJobTracking() {
  const { data: session } = useSession();
  const [activity, setActivity] = useState<JobActivity>({
    applications: [],
    views: [],
    stats: { totalApplications: 0, totalViews: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchActivity();
    }
  }, [session]);

  const fetchActivity = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile/activity');
      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }

      const data = await response.json();
      setActivity(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity';
      setError(errorMessage);
      console.error('Error fetching job activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const trackJobView = async (jobId: string, source: string = 'direct') => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });

      if (!response.ok) {
        throw new Error('Failed to track view');
      }

      // Refresh activity data
      await fetchActivity();
    } catch (err) {
      console.error('Error tracking job view:', err);
    }
  };

  const trackJobApplication = async (
    jobId: string, 
    jobTitle: string, 
    company: string, 
    applicationUrl: string
  ) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: jobTitle,
          company,
          application_url: applicationUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track application');
      }

      const data = await response.json();
      
      // Refresh activity data
      await fetchActivity();
      
      return data.application;
    } catch (err) {
      console.error('Error tracking job application:', err);
      throw err;
    }
  };

  return {
    activity,
    isLoading,
    error,
    trackJobView,
    trackJobApplication,
    refetch: fetchActivity,
  };
}

// hooks/useJobActions.ts - For your job listing components
export function useJobActions() {
  const { trackJobView, trackJobApplication } = useJobTracking();

  const handleJobView = async (jobId: string, source?: string) => {
    await trackJobView(jobId, source);
  };

  const handleJobApply = async (
    jobId: string,
    jobTitle: string,
    company: string,
    externalUrl: string
  ) => {
    try {
      // Track the application
      await trackJobApplication(jobId, jobTitle, company, externalUrl);
      
      // Open external application URL
      window.open(externalUrl, '_blank');
    } catch (error) {
      console.error('Error handling job application:', error);
      // Still open the external URL even if tracking fails
      window.open(externalUrl, '_blank');
    }
  };

  return {
    handleJobView,
    handleJobApply,
  };
}