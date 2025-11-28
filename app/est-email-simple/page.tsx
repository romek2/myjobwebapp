'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Mail, RefreshCw, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmailConfig {
  hasApiKey: boolean;
  hasFromEmail: boolean;
  fromEmail?: string;
  userEmail?: string;
  userName?: string;
  ready: boolean;
}

interface EmailResult {
  success?: boolean;
  message?: string;
  details?: any;
  error?: string;
}

export default function SimpleEmailTestPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadConfig();
    }
  }, [session]);

  const loadConfig = async () => {
    try {
      setConfigLoading(true);
      const response = await fetch('/api/test-simple-email');
      const data = await response.json();
      
      if (response.ok) {
        setConfig(data);
      } else {
        setResult({ error: data.error || 'Failed to load configuration' });
      }
    } catch (error) {
      setResult({ error: 'Failed to load configuration' });
    } finally {
      setConfigLoading(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch('/api/test-simple-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      setResult(data);
      
    } catch (error) {
      setResult({ 
        error: 'Network error occurred', 
        details: 'Could not connect to the email API' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold mb-4">Email Test</h1>
            <p className="mb-6 text-gray-600">Please sign in to test email functionality.</p>
            <Button onClick={() => window.location.href = '/api/auth/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (configLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Email System Test</h1>
        <p className="text-gray-600">Test your Resend integration with a simple email</p>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Resend API Key:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  config.hasApiKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {config.hasApiKey ? '✓ Configured' : '✗ Missing'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>From Email:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  config.hasFromEmail ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {config.hasFromEmail ? config.fromEmail : '✗ Missing'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Test Recipient:</span>
                <span className="text-sm text-gray-600">{config.userEmail}</span>
              </div>
              
              <div className={`p-3 rounded-md ${
                config.ready ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm font-medium ${
                  config.ready ? 'text-green-800' : 'text-red-800'
                }`}>
                  {config.ready ? '✓ Ready to send emails' : '✗ Configuration incomplete'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Failed to load configuration</p>
          )}
        </CardContent>
      </Card>

      {/* Test Button */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will send a test email to your account ({session.user?.email}) 
              to verify that Resend is working correctly.
            </p>
            
            <Button
              onClick={sendTestEmail}
              disabled={isLoading || !config?.ready}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
            
            {!config?.ready && (
              <p className="text-sm text-red-600">
                Please configure RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel environment variables.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardContent className="p-6">
            {result.success ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-medium text-green-800">Email Sent Successfully!</h3>
                </div>
                <p className="text-green-700 mb-3">{result.message}</p>
                
                {result.details && (
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-sm text-gray-600 mb-2"><strong>Details:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>Recipient: {result.details.recipient}</li>
                      <li>From: {result.details.from}</li>
                      {result.details.messageId && <li>Message ID: {result.details.messageId}</li>}
                      <li>Timestamp: {new Date(result.details.timestamp).toLocaleString()}</li>
                    </ul>
                  </div>
                )}
                
                <p className="text-sm text-green-600 mt-3">
                  ✓ Check your email inbox (and spam folder) for the test message.
                </p>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {result.error}
                  {result.details && (
                    <div className="mt-2 text-xs font-mono bg-red-50 p-2 rounded overflow-auto">
                      {typeof result.details === 'string' 
                        ? result.details 
                        : JSON.stringify(result.details, null, 2)}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-medium mb-3 text-blue-800">How to use this test:</h3>
          <ol className="text-sm text-blue-700 space-y-1 ml-4">
            <li>1. Make sure your Resend configuration is complete (green checkmarks above)</li>
            <li>2. Click "Send Test Email" to send a test message</li>
            <li>3. Check your email inbox (and spam folder) for the test email</li>
            <li>4. If successful, your Resend integration is working!</li>
          </ol>
          
          <div className="mt-4 p-3 bg-white rounded border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">Environment Variables Needed:</p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4 font-mono">
              <li>• RESEND_API_KEY (from Resend dashboard)</li>
              <li>• RESEND_FROM_EMAIL (e.g., noreply@workr.tech)</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-white rounded border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">Troubleshooting:</p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4">
              <li>• Verify RESEND_API_KEY in Vercel environment variables</li>
              <li>• Ensure your domain is verified in Resend dashboard</li>
              <li>• Check that RESEND_FROM_EMAIL matches your verified domain</li>
              <li>• Look for error details in the result above</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}