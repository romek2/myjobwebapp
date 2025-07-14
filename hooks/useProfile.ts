// hooks/useProfile.ts - Updated for your Supabase schema
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Skill {
  id: number; // Your Supabase uses SERIAL (integer) IDs
  user_id: string;
  name: string;
  category: 'programming' | 'framework' | 'tool' | 'soft' | 'other';
  created_at: string;
}

interface UserProfile {
  skills: Skill[];
  experience_level: 'entry' | 'mid' | 'senior' | 'lead';
  preferred_location: 'remote' | 'hybrid' | 'onsite' | 'no-preference';
  salary_min?: number;
  salary_max?: number;
  job_types: string[];
}

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

interface JobAlert {
  id: string;
  userId: string;
  name: string;
  keywords: string;
  frequency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile>({
    skills: [],
    experience_level: 'mid',
    preferred_location: 'remote',
    job_types: ['Full-time'],
  });
  const [resume, setResume] = useState<Resume | null>(null);
  const [jobAlerts, setJobAlerts] = useState<JobAlert[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'FREE' | 'PRO'>('FREE');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      
      if (data.profile) {
        // Update profile state with your Supabase data structure
        setProfile({
          skills: data.profile.skills || [],
          experience_level: data.profile.profile?.experience_level || 'mid',
          preferred_location: data.profile.profile?.preferred_location || 'remote',
          salary_min: data.profile.profile?.salary_min,
          salary_max: data.profile.profile?.salary_max,
          job_types: data.profile.profile?.job_types || ['Full-time'],
        });
        
        setResume(data.profile.resume);
        setJobAlerts(data.profile.jobAlerts || []);
        setSubscriptionStatus(data.profile.user?.subscriptionStatus || 'FREE');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setError(null);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const data = await response.json();
      
      // Update local state
      setProfile(prev => ({ ...prev, ...updates }));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      console.error('Error updating profile:', err);
      return false;
    }
  };

  return {
    profile,
    setProfile,
    resume,
    setResume,
    jobAlerts,
    setJobAlerts,
    subscriptionStatus,
    isPro: subscriptionStatus === 'PRO',
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}