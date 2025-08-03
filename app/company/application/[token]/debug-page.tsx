// app/company/application/[token]/debug-page.tsx
// Debug version of the company portal page to see what's happening

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function DebugCompanyPortal() {
  const params = useParams();
  const token = params.token as string;
  
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchStep, setFetchStep] = useState('Starting...');

  useEffect(() => {
    if (token) {
      debugLoadApplicationData();
    }
  }, [token]);

  const debugLoadApplicationData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setFetchStep('Fetching application data...');
      
      console.log('🔍 Debug: Fetching data for token:', token);
      
      const response = await fetch(`/api/company/application/${token}`);
      
      setFetchStep('Processing response...');
      console.log('🔍 Debug: Response status:', response.status);
      console.log('🔍 Debug: Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Debug: Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔍 Debug: Response data:', data);
      
      setDebugData(data);
      setFetchStep('Complete');
      
    } catch (err) {
      console.error('🔍 Debug: Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load application';
      setError(errorMessage);
      setFetchStep('Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Debug Header */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🔍 Company Portal Debug Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Token:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{token}</code></p>
              <p><strong>Current Step:</strong> {fetchStep}</p>
              <p><strong>Loading:</strong> {isLoading ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Error:</strong> {error ? `❌ ${error}` : '✅ None'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Loading application data...</p>
              <p className="text-sm text-gray-500 mt-2">{fetchStep}</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <h2 className="text-xl font-semibold text-red-800">Debug Error</h2>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">Debugging Steps:</h3>
                <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
                  <li>Check if the API route exists: <code>/api/company/application/[token]/route.ts</code></li>
                  <li>Verify token exists in company_access_tokens table</li>
                  <li>Check if application_id matches a real application</li>
                  <li>Look at browser Network tab for detailed error</li>
                  <li>Check server logs for backend errors</li>
                </ol>
              </div>
              
              <button 
                onClick={debugLoadApplicationData}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Retry Debug
              </button>
            </CardContent>
          </Card>
        )}

        {/* Success State - Show All Data */}
        {debugData && !isLoading && (
          <div className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-green-800">✅ Data Loaded Successfully</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Parse Application Data */}
            {debugData.application && (
              <Card>
                <CardHeader>
                  <CardTitle>📋 Application Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Job Title:</h4>
                      <p>{debugData.application.job_title || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Company:</h4>
                      <p>{debugData.application.company || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Status:</h4>
                      <p>{debugData.application.status || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Applied At:</h4>
                      <p>{debugData.application.applied_at ? new Date(debugData.application.applied_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  
                  {debugData.application.cover_letter && (
                    <div className="mt-4">
                      <h4 className="font-medium">Cover Letter:</h4>
                      <div className="bg-gray-50 p-3 rounded mt-2">
                        <p className="text-sm">{debugData.application.cover_letter}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show Job Data if Available */}
            {debugData.job && (
              <Card>
                <CardHeader>
                  <CardTitle>💼 Job Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Title:</strong> {debugData.job.title}</p>
                    <p><strong>Company:</strong> {debugData.job.company}</p>
                    <p><strong>Location:</strong> {debugData.job.location}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show What the Original Portal Would See */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">🎯 Original Portal Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Application Data:</span>
                    {debugData.application ? (
                      <span className="text-green-600">✅ Available</span>
                    ) : (
                      <span className="text-red-600">❌ NULL - This is the problem!</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Company Property:</span>
                    {debugData.application?.company ? (
                      <span className="text-green-600">✅ "{debugData.application.company}"</span>
                    ) : (
                      <span className="text-red-600">❌ Missing - This causes the error!</span>
                    )}
                  </div>
                  
                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Issue:</strong> The original portal is trying to read <code>applicationData.company</code> 
                      but the data structure might be different than expected.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}