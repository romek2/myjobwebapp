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
  location?: string;
}

export function useJobViews() {
  const { data: session } = useSession();
  const [viewCount, setViewCount] = useState(0);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Get view count
      const viewResponse = await fetch('/api/profile/view-count');
      const viewData = await viewResponse.json();
      setViewCount(viewData.viewCount);

      // Get applications
      const appResponse = await fetch('/api/profile/applications');
      const appData = await appResponse.json();
      setApplications(appData.applications);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const trackView = async (jobId: string) => {
    try {
      await fetch('/api/jobs/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      
      setViewCount(prev => prev + 1);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const trackApplication = async (
    jobId: string, 
    jobTitle: string, 
    company: string, 
    applicationUrl: string,
    location?: string
  ) => {
    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobTitle,
          company,
          applicationUrl,
          location
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track application');
      }

      const data = await response.json();
      
      // Update applications list
      setApplications(prev => [data.application, ...prev]);
      
      return data.application;
    } catch (error) {
      console.error('Error tracking application:', error);
      throw error;
    }
  };

  return { 
    viewCount, 
    applications, 
    isLoading, 
    trackView, 
    trackApplication,
    refetch: fetchData 
  };
}
