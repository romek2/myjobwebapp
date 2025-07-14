// hooks/useSkills.ts - Fixed with interface definition
import { useState } from 'react';

// Define the Skill interface to match your Supabase user_skills table
interface Skill {
  id: number;
  user_id: string;
  name: string;
  category: 'programming' | 'framework' | 'tool' | 'soft' | 'other';
  created_at: string;
}

export function useSkills() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSkill = async (name: string, category: string = 'other'): Promise<Skill> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add skill');
      }

      const data = await response.json();
      return data.skill;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add skill';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removeSkill = async (skillId: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/profile/skills?id=${skillId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove skill');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove skill';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addSkill,
    removeSkill,
    isLoading,
    error,
  };
}