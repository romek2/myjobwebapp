'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, Cog, MailIcon, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProAccess } from '@/lib/subscription';
import Link from 'next/link';

type ProcessResult = {
  success?: boolean;
  message?: string;
  results?: {
    processed: number;
    matched: number;
    emailed: number;
    errors: number;
  };
  error?: string;
  details?: string;
} | null;

export default function AdminProcessAlertsPage() {
  const { data: session } = useSession();
  const isPro = useProAccess();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult>(null);
  const [jobId, setJobId] = useState('');

  const processAlerts = async () => {
    if (!session?.user?.email) {
      setResult({ error: 'You must be signed in to use this feature' });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);
      
      // Prepare the request body
      const requestBody: any = {};
      
      // Only add jobIds if a specific one is provided
      if (jobId.trim()) {
        requestBody.jobIds = [jobId.trim()];
      }
      
      const response = await fetch('/api/admin/process-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setResult({ 
          error: data.error || 'Failed to process job alerts', 
          details: data.details || 'No additional details available' 
        });
      }
    } catch (err: any) {
      setResult({ 
        error: 'An unexpected error occurred', 
        details: err?.message || 'Unknown error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Cog className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="mb-6 text-gray-600">Please sign in to access admin tools.</p>
          <Link href="/api/auth/signin" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Check if user has admin access (in this case, we're using PRO status as a proxy)
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin: Process Job Alerts</h1>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page. PRO subscription required.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <span className="inline-block p-3 rounded-full bg-yellow-100 text-yellow-800 mb-4">
                <Cog className="h-6 w-6" />
              </span>
              <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
              <p className="text-gray-600 mb-6">
                This is an admin-only feature which requires a PRO subscription.
              </p>
            </div>
            
            <Link href="/pricing" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg inline-block">
              Upgrade to PRO
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin: Process Job Alerts</h1>
      
      <div className="mb-6 inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
        <CheckCircle2 className="h-4 w-4 mr-1" />
        Admin Access Enabled
      </div>
      
      {result?.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {result.error}
            {result.details && (
              <div className="mt-2 text-xs font-mono bg-red-50 p-2 rounded">
                {result.details}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manual Job Alert Processing</CardTitle>
          <CardDescription>
            Process job alerts against recent jobs or a specific job ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label htmlFor="jobId" className="block text-sm font-medium text-gray-700 mb-1">
                Specific Job ID (Optional)
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  id="jobId"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  placeholder="Leave empty to process all recent jobs"
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                If you leave this empty, all jobs from the last 24 hours will be processed
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This tool processes job alerts for matching jobs and sends 
                real emails to users. Only use this when necessary.
              </p>
            </div>
            
            <Button
              onClick={processAlerts}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 
                <><MailIcon className="mr-2 h-4 w-4" /> Process Job Alerts</>
              }
            </Button>
            
            {result?.success && result.results && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
                <h3 className="font-medium text-green-800 mb-3 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Processing Complete
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500">Jobs Processed</p>
                    <p className="text-xl font-semibold">{result.results.processed}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500">Matches Found</p>
                    <p className="text-xl font-semibold">{result.results.matched}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500">Emails Sent</p>
                    <p className="text-xl font-semibold">{result.results.emailed}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500">Errors</p>
                    <p className="text-xl font-semibold">{result.results.errors}</p>
                  </div>
                </div>
                
                {result.message && (
                  <p className="text-green-700">{result.message}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-50 border border-gray-200">
        <CardContent className="p-6">
          <h3 className="font-medium mb-3">About Job Alert Processing</h3>
          <p className="text-gray-700 mb-3">
            This admin tool allows you to manually trigger the job alert matching process. 
            The system will check all active alerts against specified jobs and send emails for any matches.
          </p>
          <p className="text-gray-700 mb-3">
            In normal operation, this process happens automatically when new jobs are added to the system.
          </p>
          <p className="text-gray-700">
            <strong>Important:</strong> Each job is only sent to an alert once. If you process the same job multiple times,
            emails will only be sent for the first match.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}