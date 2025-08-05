// app/debug-env/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function DebugEnvPage() {
  const { data: session } = useSession();
  const [envData, setEnvData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEnvData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug-env');
      const data = await response.json();
      
      if (response.ok) {
        setEnvData(data);
      } else {
        setError(data.error || 'Failed to load environment data');
      }
    } catch (err) {
      setError('Failed to connect to debug API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadEnvData();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
            <p className="mb-6 text-gray-600">Please sign in to debug environment variables.</p>
            <Button onClick={() => window.location.href = '/api/auth/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Environment Variables Debug</h1>
          <p className="text-gray-600">Check if your environment variables are loading correctly</p>
        </div>
        <Button onClick={loadEnvData} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-800">
              <XCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {envData && (
        <div className="space-y-6">
          {/* Environment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">NODE_ENV:</span>
                  <p className="font-mono">{envData.environment}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">VERCEL_ENV:</span>
                  <p className="font-mono">{envData.vercelEnv || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">User:</span>
                  <p className="font-mono">{envData.user}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Timestamp:</span>
                  <p className="font-mono text-xs">{new Date(envData.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SendGrid Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>SendGrid Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* API Key */}
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">SENDGRID_API_KEY</div>
                    <div className="text-sm text-gray-600">
                      Length: {envData.envCheck.SENDGRID_API_KEY.length} characters
                    </div>
                    <div className="text-sm text-gray-600">
                      Preview: <code>{envData.envCheck.SENDGRID_API_KEY.prefix}</code>
                    </div>
                    <div className="text-sm text-gray-600">
                      Valid Format: {envData.envCheck.SENDGRID_API_KEY.isValid ? 'Yes (starts with SG.)' : 'No (should start with SG.)'}
                    </div>
                  </div>
                  <div>
                    {envData.envCheck.SENDGRID_API_KEY.exists ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>

                {/* From Email */}
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">SENDGRID_FROM_EMAIL</div>
                    <div className="text-sm text-gray-600">
                      Value: <code>{envData.envCheck.SENDGRID_FROM_EMAIL.value}</code>
                    </div>
                    <div className="text-sm text-gray-600">
                      Valid Email: {envData.envCheck.SENDGRID_FROM_EMAIL.isEmail ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div>
                    {envData.envCheck.SENDGRID_FROM_EMAIL.exists ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All SendGrid Variables */}
          <Card>
            <CardHeader>
              <CardTitle>All SendGrid Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(envData.envCheck.allSendGridVars).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(envData.envCheck.allSendGridVars).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <code className="text-sm">{key}</code>
                        <div className="text-xs text-gray-600">Length: {value.length}</div>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-600">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p>No SendGrid environment variables found!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Important Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Other Important Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <code className="text-sm">NEXTAUTH_URL</code>
                    <div className="text-xs text-gray-600">{envData.envCheck.NEXTAUTH_URL.value}</div>
                  </div>
                  {envData.envCheck.NEXTAUTH_URL.exists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <code className="text-sm">NEXTAUTH_SECRET</code>
                    <div className="text-xs text-gray-600">Length: {envData.envCheck.NEXTAUTH_SECRET.length}</div>
                  </div>
                  {envData.envCheck.NEXTAUTH_SECRET.exists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card className="bg-blue-50 border border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Troubleshooting Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-blue-700">
                <div>
                  <strong>If environment variables are missing:</strong>
                  <ol className="mt-1 ml-4 space-y-1">
                    <li>1. Check Vercel Dashboard → Project Settings → Environment Variables</li>
                    <li>2. Make sure variables are added to the correct environment (Production/Preview/Development)</li>
                    <li>3. Redeploy your project after adding variables</li>
                    <li>4. Wait a few minutes for changes to propagate</li>
                  </ol>
                </div>
                
                <div>
                  <strong>For SendGrid API Key:</strong>
                  <ul className="mt-1 ml-4 space-y-1">
                    <li>• Should start with "SG." and be about 69 characters long</li>
                    <li>• Get from SendGrid Dashboard → Settings → API Keys</li>
                    <li>• Make sure it has "Mail Send" permissions</li>
                  </ul>
                </div>
                
                <div>
                  <strong>For From Email:</strong>
                  <ul className="mt-1 ml-4 space-y-1">
                    <li>• Must use your verified domain (workr.tech)</li>
                    <li>• Example: noreply@workr.tech</li>
                    <li>• Must match a verified Sender Identity in SendGrid</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}