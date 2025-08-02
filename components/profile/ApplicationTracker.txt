// components/profile/ApplicationTracker.tsx - Updated to use real API
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Clock,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  applied_at: string;
  desired_salary?: number;
  available_start_date?: string;
  cover_letter?: string;
  resume_file_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  phone?: string;
}

export default function ApplicationTracker() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load applications from real API
  const loadApplications = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load applications';
      setError(errorMessage);
      console.error('Error loading applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load applications on component mount
  useEffect(() => {
    loadApplications();
  }, [session]);

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-yellow-100 text-yellow-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!session) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Sign in to track applications</h3>
          <p className="text-gray-600">Keep track of your job applications and their status.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Applications
              {applications.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {applications.length}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Track your job applications and their status
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadApplications}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error loading applications:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading applications...</span>
          </div>
        ) : applications.length > 0 ? (
          <div className="space-y-4">
            {/* Application List */}
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 break-words text-sm sm:text-base">
                        {app.job_title}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Building className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="break-words">{app.company}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Applied {formatDate(app.applied_at)}
                        </span>
                        {app.desired_salary && (
                          <span>Salary: ${app.desired_salary.toLocaleString()}</span>
                        )}
                        {app.resume_file_url && (
                          <a 
                            href={app.resume_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Resume
                          </a>
                        )}
                      </div>
                      {app.cover_letter && (
                        <p className="text-xs text-gray-600 mt-2 italic line-clamp-2">
                          "{app.cover_letter.substring(0, 100)}..."
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {applications.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline">
                  View All {applications.length} Applications
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              When you apply to jobs, they'll appear here so you can track their status.
            </p>
            <p className="text-sm text-gray-500">
              Try applying to some jobs to see them tracked here!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}