'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bell, CheckCircle2, MailIcon, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProAccess } from '@/lib/subscription';
import Link from 'next/link';

type TestResult = {
  success?: boolean;
  timestamp?: string;
  mode?: string;
  results?: {
    alertsProcessed: number;
    matchesFound: number;
    emailsSent: number;
    emailsFailed: number;
    details: Array<{
      alertId: string;
      alertName: string;
      status: string;
      userEmail?: string;
      matchesFound?: number;
      jobIds?: string[];
      reason?: string;
      error?: string;
    }>;
  };
  error?: string;
  details?: string;
  message?: string;
} | null;

export default function TestJobAlertsPage() {
  const { data: session } = useSession();
  const isPro = useProAccess();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult>(null);

  const testJobAlerts = async () => {
    if (!session?.user?.email) {
      setResult({ error: 'You must be signed in to test job alerts' });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);
      
      // Set up the secret for the cron job
      const response = await fetch('/api/debug/test-job-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testMode: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setResult({ 
          error: data.error || 'Failed to test job alerts', 
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
          <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign in to test job alerts</h1>
          <p className="mb-6 text-gray-600">You need to be signed in to test job alerts.</p>
          <Link href="/api/auth/signin" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Test Job Alerts</h1>
        
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <span className="inline-block p-3 rounded-full bg-yellow-100 text-yellow-800 mb-4">
                <Bell className="h-6 w-6" />
              </span>
              <h2 className="text-2xl font-bold mb-2">PRO Feature Required</h2>
              <p className="text-gray-600 mb-6">
                Testing job alerts requires a PRO subscription.
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
      <h1 className="text-3xl font-bold mb-6">Test Job Alerts</h1>
      
      <div className="mb-6 inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
        <CheckCircle2 className="h-4 w-4 mr-1" />
        PRO Feature Enabled
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
          <CardTitle>Test Job Alert Matching</CardTitle>
          <CardDescription>
            Process your alerts against recent jobs and send matching emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md mb-6">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> This will process your active job alerts against recent jobs and send 
                test emails if there are matches. The email will include "[TEST]" in the subject line.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="font-medium mb-2">Prerequisites:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>You should have at least one active job alert set up</li>
                <li>There should be recent jobs in the system (from the last 24 hours)</li>
                <li>Your job alert keywords should match some of the recent jobs</li>
              </ul>
            </div>
            
            <Button
              onClick={testJobAlerts}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
            >
              {isLoading ? 
                'Processing...' : 
                <><MailIcon className="mr-2 h-4 w-4" /> Test Job Matching & Alerts</>
              }
            </Button>
            
            {result && result.success && result.results && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="font-medium text-green-800 mb-3 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Test Completed Successfully
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500">Alerts Processed</p>
                    <p className="text-xl font-semibold">{result.results.alertsProcessed}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500">Matches Found</p>
                    <p className="text-xl font-semibold">{result.results.matchesFound}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500">Emails Sent</p>
                    <p className="text-xl font-semibold">{result.results.emailsSent}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500">Emails Failed</p>
                    <p className="text-xl font-semibold">{result.results.emailsFailed}</p>
                  </div>
                </div>
                
                {result.results.details && result.results.details.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Detailed Results:</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                      {result.results.details.map((detail, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded border ${
                            detail.status === 'success' 
                              ? 'bg-green-50 border-green-200' 
                              : detail.status === 'error'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <p className="font-medium">{detail.alertName}</p>
                          <div className="text-sm mt-1">
                            <p>
                              Status: <span className={`${
                                detail.status === 'success' 
                                  ? 'text-green-600' 
                                  : detail.status === 'error'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}>
                                {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                              </span>
                            </p>
                            {detail.matchesFound !== undefined && (
                              <p>Matches found: {detail.matchesFound}</p>
                            )}
                            {detail.userEmail && (
                              <p>Email sent to: {detail.userEmail}</p>
                            )}
                            {detail.reason && (
                              <p>Reason: {detail.reason}</p>
                            )}
                            {detail.error && (
                              <p className="text-red-600">Error: {detail.error}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.results.matchesFound === 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-700">
                      <strong>No matches found.</strong> This could be because:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm text-blue-700">
                      <li>Your alert keywords don't match any recent jobs</li>
                      <li>There are no new jobs in the last 24 hours</li>
                      <li>All matching jobs have already been sent to you</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {result && result.message && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-blue-700">{result.message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-50 border border-gray-200">
        <CardContent className="p-6">
          <h3 className="font-medium mb-3">About Job Alert Testing</h3>
          <p className="text-gray-700 mb-3">
            This page allows you to test the job alert matching and email notification system. When you run a test:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
            <li>Your active job alerts are checked against recent jobs from the last 24 hours</li>
            <li>If there are matches, a test email will be sent to your account</li>
            <li>The email will include "[TEST]" in the subject line</li>
            <li>The system will record which jobs have been sent, so you won't get duplicate alerts</li>
          </ul>
          <p className="text-gray-700">
            In production, this process runs automatically when new jobs are added to the system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}