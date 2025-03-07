'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

// Define result type
type ResultType = {
  success?: boolean;
  message?: string;
  error?: string;
  details?: string;
} | null;

export default function TestEmailPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResultType>(null);

  const sendTestEmail = async () => {
    if (!session?.user?.email) {
      setResult({ error: 'You must be signed in to send a test email' });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch('/api/test-email');
      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ 
          error: data.error || 'Failed to send email', 
          details: data.details || 'No additional details available' 
        });
      }
    } catch (err: any) { // Type the error as any to access message property
      setResult({ 
        error: 'An unexpected error occurred', 
        details: err?.message || 'Unknown error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">SendGrid Email Test</h1>
      
      {!session ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          Please sign in to test email functionality.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <p className="mb-4">
            This will send a test email to: <strong>{session.user.email}</strong>
          </p>
          <button
            onClick={sendTestEmail}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      )}
      
      {result && (
        <div className={`p-4 rounded-lg mb-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <div className="text-green-700">
              <p className="font-bold">Success!</p>
              <p>{result.message}</p>
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
        <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
        
        <ol className="list-decimal ml-6 space-y-2">
          <li>Make sure you've installed the SendGrid package:
            <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">npm install @sendgrid/mail</pre>
          </li>
          
          <li>Add these environment variables to your <code>.env.local</code> file:
            <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=your_verified_sender@example.com
            </pre>
          </li>
          
          <li>Make sure you've verified your sender email in SendGrid</li>
          
          <li>Click the button above to test your configuration</li>
        </ol>
      </div>
    </div>
  );
}