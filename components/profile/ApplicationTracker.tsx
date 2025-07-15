// components/profile/ApplicationTracker.tsx - Working version with real data
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Clock,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useJobViews } from '@/hooks/useJobViews';

export default function ApplicationTracker() {
  const router = useRouter();
  const { applications, isLoading } = useJobViews();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
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
          Track jobs you've applied to
        </CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length > 0 ? (
          <div className="space-y-4">
            {/* Application Cards */}
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => (
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
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {app.location && (
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {app.location}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Applied {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                        {app.application_url && (
                          <a 
                            href={app.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Application
                          </a>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                      app.status === 'applied' ? 'bg-blue-100 text-blue-800' : 
                      app.status === 'interview' ? 'bg-green-100 text-green-800' : 
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {applications.length > 3 && (
              <div className="text-center pt-2">
                <Button 
                  variant="outline"
                  onClick={() => router.push("/profile/applications")}
                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                >
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
              When you apply for jobs, they will appear here. Click "Apply Now" on any job to get started!
            </p>
            <Button 
              onClick={() => router.push("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Browse Jobs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}