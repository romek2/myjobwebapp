'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

type ResultType = {
  success?: boolean;
  message?: string;
  scheduledTime?: string;
  error?: string;
  details?: string;
} | null;

export default function ScheduledEmailTestPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResultType>(null);

  const scheduleEmail = async () => {
    if (!session?.user?.email) {
      setResult({ error: 'You must be signed in to schedule an email' });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch('/api/schedule-email');
      const data = await response.json();
      
      if (response.ok) {
        setResult({ 
          success: true, 
          message: data.message,
          scheduledTime: data.scheduledTime
        });
      } else {
        setResult({ 
          error: data.error || 'Failed to schedule email', 
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

  // Function to format the date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Schedule Email Test</h1>
      
      {!session ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          Please sign in to test scheduled emails.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <p className="mb-4">
            This will schedule an email to be sent to <strong>{session.user.email}</strong> in approximately 1 minute.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <p className="text-blue-700 text-sm">
              <strong>Important:</strong> For this test to work properly, the server must remain running for at least 1 minute after 
              clicking the button. In production, you would use a more robust solution like Vercel Cron Jobs.
            </p>
          </div>
          
          <button
            onClick={scheduleEmail}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Scheduling...' : 'Schedule Email (1 minute)'}
          </button>
        </div>
      )}
      
      {result && (
        <div className={`p-4 rounded-lg mb-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <div className="text-green-700">
              <p className="font-bold">Success!</p>
              <p>{result.message}</p>
              {result.scheduledTime && (
                <div className="mt-2 text-sm">
                  <p><strong>Current time:</strong> {formatDate(new Date().toISOString())}</p>
                  <p><strong>Expected delivery:</strong> {formatDate(result.scheduledTime)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-700">
              <p className="font-bold">Error:</p>
              <p>{result.error}</p>
              {result.details && (
                <div className="mt-2">
                  <p className="font-bold text-sm">Details:</p>
                  <pre className="bg-red-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                    {result.details}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">About Scheduled Emails</h2>
        
        <p className="mb-4">
          There are two ways to implement scheduled emails in your application:
        </p>
        
        <ol className="list-decimal ml-6 space-y-4">
          <li>
            <strong>Simple setTimeout (this demo):</strong>
            <p className="mt-1 text-sm">
              This approach uses JavaScript's setTimeout to delay sending the email. 
              It requires the server to remain running and is suitable for development/testing.
            </p>
          </li>
          
          <li>
            <strong>Vercel Cron Jobs (production):</strong>
            <p className="mt-1 text-sm">
              For production, Vercel offers Cron Jobs that can trigger endpoints at scheduled intervals.
              Add this to your vercel.json file:
            </p>
            <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/cron/send-emails",
      "schedule": "* * * * *"
    }
  ]
}`}
            </pre>
            <p className="mt-1 text-sm">
              The above schedule runs every minute. For production, you would use a more appropriate
              schedule like <code>"0 9 * * *"</code> (daily at 9am).
            </p>
          </li>
        </ol>
      </div>
    </div>
  );
}