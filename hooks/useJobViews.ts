import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useJobViews() {
  const { data: session } = useSession();
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      fetchViewCount();
    }
  }, [session]);

  const fetchViewCount = async () => {
    try {
      const response = await fetch('/api/profile/view-count');
      const data = await response.json();
      setViewCount(data.viewCount);
    } catch (error) {
      console.error('Error fetching view count:', error);
    }
  };

  const trackView = async (jobId: string) => {
    try {
      await fetch('/api/jobs/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      
      // Update count
      setViewCount(prev => prev + 1);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  return { viewCount, trackView };
}