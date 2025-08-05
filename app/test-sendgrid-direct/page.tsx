// app/test-sendgrid-direct/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Mail, RefreshCw, Key, AtSign, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestResult {
  success?: boolean;
  message?: string;
  details?: any;
  error?: string;
  help?: string;
}

export default function DirectSendGridTestPage() {
  const { data: session } = useSession();
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const sendTestEmail = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch('/api/test-sendgrid-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          fromEmail: fromEmail.trim(),
          testMessage: testMessage.trim()
        })
      });
      
      const data = await response.json();
      setResult(data);
      
    } catch (error) {
      setResult({ 
        error: 'Network error occurred', 
        details: 'Could not connect to the test API'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = apiKey.trim() && fromEmail.trim();

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold mb-4">Direct SendGrid Test</h1>
            <p className="mb-6 text-gray-600">Please sign in to test SendGrid directly.</p>
            <Button onClick={() => window.location.href = '/api/auth/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Direct SendGrid Test</h1>
        <p className="text-gray-600">Enter your SendGrid credentials directly to test email functionality</p>
      </div>

      {/* Test Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            SendGrid Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SendGrid API Key *
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get this from SendGrid Dashboard → Settings → API Keys
            </p>
          </div>

          {/* From Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Email Address *
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@workr.tech"
                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Must be a verified sender in SendGrid (use your domain: workr.tech)
            </p>
          </div>

          {/* Test Message (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Test Message (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Add a custom message to include in the test email..."
                rows={3}
                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Test Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-800 mb-2">Test Details:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>Recipient:</strong> {session.user?.email}</li>
              <li><strong>Your Name:</strong> {session.user?.name || 'User'}</li>
              <li><strong>Test Type:</strong> Direct API call (bypasses environment variables)</li>
            </ul>
          </div>

          {/* Send Button */}
          <Button
            onClick={sendTestEmail}
            disabled={isLoading || !isFormValid}
            className="w-full"
            size="lg"
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

          {!isFormValid && (
            <p className="text-sm text-red-600 text-center">
              Please fill in both API Key and From Email to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardContent className="p-6">
            {result.success ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="font-semibold text-green-800 text-lg">Test Email Sent Successfully! 🎉</h3>
                </div>
                
                <p className="text-green-700 mb-4">{result.message}</p>
                
                {result.details && (
                  <div className="bg-white p-4 rounded border border-green-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">Technical Details:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Status Code:</span>
                        <span className="ml-2 font-mono">{result.details.statusCode}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Message ID:</span>
                        <span className="ml-2 font-mono text-xs">{result.details.messageId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">From:</span>
                        <span className="ml-2 font-mono">{result.details.fromEmail}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">To:</span>
                        <span className="ml-2 font-mono">{result.details.toEmail}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-green-100 rounded">
                  <p className="text-sm text-green-800">
                    ✅ <strong>Success!</strong> Check your email inbox (and spam folder) for the test message.
                    Your SendGrid configuration is working correctly!
                  </p>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div>
                      <strong>Error:</strong> {result.error}
                    </div>
                    
                    {result.help && (
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="text-sm text-red-800">
                          <strong>💡 Suggested Fix:</strong> {result.help}
                        </p>
                      </div>
                    )}
                    
                    {result.details && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium">
                          Show Technical Details
                        </summary>
                        <div className="mt-2 text-xs font-mono bg-red-50 p-3 rounded border border-red-200 overflow-auto">
                          {typeof result.details === 'string' 
                            ? result.details 
                            : JSON.stringify(result.details, null, 2)}
                        </div>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-yellow-50 border border-yellow-200">
        <CardContent className="p-6">
          <h3 className="font-medium mb-3 text-yellow-800">Quick Setup Guide:</h3>
          <div className="space-y-4 text-sm text-yellow-700">
            <div>
              <p className="font-medium">1. Get your SendGrid API Key:</p>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Go to SendGrid Dashboard → Settings → API Keys</li>
                <li>• Click "Create API Key" → "Restricted Access"</li>
                <li>• Enable only "Mail Send" permission</li>
                <li>• Copy the key (starts with "SG.")</li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium">2. Set up your From Email:</p>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Use your domain: something@workr.tech</li>
                <li>• Go to Settings → Sender Authentication</li>
                <li>• Either verify your domain OR create a Single Sender</li>
                <li>• The from email must match what's verified</li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium">3. Test it:</p>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Paste your API key and from email above</li>
                <li>• Click "Send Test Email"</li>
                <li>• Check your inbox for the test message</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}