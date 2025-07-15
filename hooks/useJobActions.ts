import { useJobViews } from './useJobViews';

export function useJobActions() {
  const { trackView, trackApplication } = useJobViews();

  const handleJobView = async (jobId: string) => {
    await trackView(jobId);
  };

  const handleJobApply = async (
    jobId: string,
    jobTitle: string,
    company: string,
    externalUrl: string,
    location?: string
  ) => {
    try {
      // Track the application
      await trackApplication(jobId, jobTitle, company, externalUrl, location);
      
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