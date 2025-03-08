'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bell, CheckCircle2, Clock, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProAccess } from '@/lib/subscription';
import Link from 'next/link';

type CronTestResult = {
  success?: boolean;
  mode?: string;
  frequency?: string;
  emailsSent?: number;
  emailsFailed?: number;
  results?: Array<{
    userId: string;
    email: string;
    status: string;
    error?: string;
  }>;
  error?: string;
  details?: string;
  message?: string;
} | null;

export default function CronTestingPage() {
  const { data: session } = useSession();
  const isPro = useProAccess();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CronTestResult>(null);
  const [selectedFrequency, setSelectedFrequency] = useState('daily');

  const triggerCronJob = async (frequency: string) => {
    if (!session?.user?.email) {
      setResult({ error: 'You must be signed in to trigger cron jobs' });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch('/api/debug/trigger-cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frequency,
          testMode: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data.result || { 
          success: true, 
          message: data.message,
          frequency
        });
      } else {
        setResult({ 
          error: data.error || 'Failed to trigger cron job', 
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
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign in to test cron jobs</h1>
          <p className="mb-6 text-gray-600">You need to be signed in to test email delivery.</p>
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
        <h1 className="text-3xl font-bold mb-6">Cron Job Testing</h1>
        
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <span className="inline-block p-3 rounded-full bg-yellow-100 text-yellow-800 mb-4">
                <Clock className="h-6 w-6" />
              </span>
              <h2 className="text-2xl font-bold mb-2">PRO Feature Required</h2>
              <p className="text-gray-600 mb-6">
                Testing cron jobs requires a PRO subscription.
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
      <h1 className="text-3xl font-bold mb-6">Cron Job Testing</h1>
      
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
          <CardTitle>Test Email Cron Jobs</CardTitle>
          <CardDescription>
            Manually trigger email jobs to test functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <p className="mb-4">
                Select the email frequency type you'd like to test:
              </p>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer flex items-center space-x-3 ${
                    selectedFrequency === 'daily' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFrequency('daily')}
                >
                  <div className={`p-2 rounded-full ${
                    selectedFrequency === 'daily' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Bell className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Daily</h3>
                    <p className="text-sm text-gray-500">Daily digest of matching jobs</p>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer flex items-center space-x-3 ${
                    selectedFrequency === 'weekly' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFrequency('weekly')}
                >
                  <div className={`p-2 rounded-full ${
                    selectedFrequency === 'weekly' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Bell className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Weekly</h3>
                    <p className="text-sm text-gray-500">Weekly summary of matching jobs</p>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer flex items-center space-x-3 ${
                    selectedFrequency === 'realtime' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFrequency('realtime')}
                >
                  <div className={`p-2 rounded-full ${
                    selectedFrequency === 'realtime' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Bell className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Real-time</h3>
                    <p className="text-sm text-gray-500">Immediate notifications for new jobs</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> This will send a test email to your address ({session.user.email}). 
                  The email will include "TEST" in the subject line to distinguish it from real alerts.
                </p>
              </div>
              
              <Button
                onClick={() => triggerCronJob(selectedFrequency)}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
              >
                {isLoading ? 
                  'Processing...' : 
                  <><Send className="mr-2 h-4 w-4" /> Send Test Email</>
                }
              </Button>
            </div>
            
            {result && result.success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="font-medium text-green-800 mb-2 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Test Completed Successfully
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Mode:</strong> {result.mode || 'Test'}</p>
                  <p><strong>Frequency:</strong> {result.frequency}</p>
                  <p><strong>Emails Sent:</strong> {result.emailsSent || 0}</p>
                  <p><strong>Emails Failed:</strong> {result.emailsFailed || 0}</p>
                  
                  {result.results && result.results.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Delivery Results:</h4>
                      <ul className="space-y-2">
                        {result.results.map((item, index) => (
                          <li key={index} className={`flex items-start ${
                            item.status === 'success' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {item.status === 'success' ? 
                              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5" /> : 
                              <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                            }
                            <span>
                              {item.email} - {item.status}
                              {item.error && (
                                <span className="block text-xs mt-1">{item.error}</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-50 border border-gray-200">
        <CardContent className="p-6">
          <h3 className="font-medium mb-3">About Cron Job Testing</h3>
          <p className="text-gray-700 mb-3">
            This page allows you to manually trigger the email cron jobs that normally run on a schedule.
            When you trigger a job:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
            <li>A test email will be sent only to your account</li>
            <li>The email will include "TEST" in the subject line</li>
            <li>The job will run with the same code that runs on the scheduled cron</li>
            <li>You'll see detailed results about the delivery</li>
          </ul>
          <p className="text-gray-700">
            In production, these jobs run automatically based on the schedule in <code>vercel.json</code>:
          </p>
          <pre className="bg-gray-100 p-3 rounded text-sm mt-2 overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/alerts/process?frequency=daily",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/alerts/process?frequency=weekly",
      "schedule": "0 8 * * 1"
    }
  ]
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}