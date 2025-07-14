// hooks/useResume.ts - Fixed with interface definition
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Define the Resume interface based on your Supabase user_resumes table
interface Resume {
  id: number;
  user_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  text_content: string;
  ats_score: number;
  tech_stack: string[];
  insights: any[];
  created_at: string;
  updated_at: string;
}

export function useResume() {
  const { data: session } = useSession();
  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchResume();
    }
  }, [session]);

  const fetchResume = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/profile/resume');
      if (!response.ok) {
        throw new Error('Failed to fetch resume');
      }
      
      const data = await response.json();
      setResume(data.resume);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch resume';
      setError(errorMessage);
      console.error('Error fetching resume:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadResume = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload resume');
      }

      const data = await response.json();
      setResume(data.resume);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload resume';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteResume = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile/resume', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete resume');
      }

      setResume(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete resume';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    resume,
    isLoading,
    isUploading,
    error,
    uploadResume,
    deleteResume,
    refetch: fetchResume,
  };
}