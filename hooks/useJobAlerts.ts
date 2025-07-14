// hooks/useJobAlerts.ts - Fixed with interface definition
import { useState } from 'react';

// Define the JobAlert interface to match your existing JobAlert table
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

export function useJobAlerts() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAlert = async (alertId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/job-alerts/${alertId}/toggle`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle alert');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle alert';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAlert = async (alertId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/job-alerts/${alertId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete alert');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete alert';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async (alertData: {
    name: string;
    keywords: string;
    frequency: string;
  }): Promise<JobAlert> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/job-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create alert');
      }

      const data = await response.json();
      return data.alert;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create alert';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleAlert,
    deleteAlert,
    createAlert,
    isLoading,
    error,
  };
}