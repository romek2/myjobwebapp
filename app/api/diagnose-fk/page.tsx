'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function SimpleDiagnosePage() {
  const { data: session } = useSession();
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. Get the current session user ID
      if (!session?.user?.id || !session?.user?.email) {
        throw new Error('No user session available');
      }
      
      const userId = session.user.id;
      const userEmail = session.user.email;
      
      // 2. Check if this user exists in the database
      const supabaseResponse = await fetch('/api/supabase-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userEmail
        })
      });
      
      if (!supabaseResponse.ok) {
        throw new Error(`API returned ${supabaseResponse.status}: ${supabaseResponse.statusText}`);
      }
      
      const data = await supabaseResponse.json();
      setResults(data);
    } catch (err: any) {
      console.error('Error running diagnostics:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Run on initial load if session exists
  useEffect(() => {
    if (session?.user) {
      runDiagnostics();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-yellow-50 p-4 rounded border border-yellow-300">
          Please sign in to access diagnostics
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Diagnostics</h1>
      
      <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-200">
        <h2 className="text-lg font-semibold mb-2">Session Info</h2>
        <div>
          <p><strong>ID:</strong> {session.user.id}</p>
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Status:</strong> {session.user.subscriptionStatus || 'Unknown'}</p>
        </div>
      </div>
      
      <button 
        onClick={runDiagnostics}
        disabled={isLoading}
        className="mb-6 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics Again'}
      </button>
      
      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded border border-red-300 text-red-800">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            {/* User Lookup Results */}
            <div className="mb-4">
              <h3 className="font-medium text-lg border-b pb-2 mb-2">User Database Check</h3>
              
              {results.userExists ? (
                <div className="text-green-600 font-medium">
                  ✅ User found in database
                  <div className="text-gray-700 font-normal mt-1">
                    <p><strong>Database ID:</strong> {results.dbUser?.id}</p>
                    <p><strong>Email:</strong> {results.dbUser?.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-red-600 font-medium">
                  ❌ User not found in database
                </div>
              )}
            </div>
            
            {/* ID Comparison */}
            {results.userExists && results.dbUser && (
              <div className="mb-4">
                <h3 className="font-medium text-lg border-b pb-2 mb-2">ID Comparison</h3>
                
                {results.dbUser.id === session.user.id ? (
                  <div className="text-green-600 font-medium">
                    ✅ Session ID matches database ID
                  </div>
                ) : (
                  <div className="text-red-600 font-medium">
                    ❌ ID mismatch
                    <div className="text-gray-700 font-normal mt-1">
                      <p><strong>Session ID:</strong> {session.user.id}</p>
                      <p><strong>Database ID:</strong> {results.dbUser.id}</p>
                    </div>
                    
                    <div className="mt-4 bg-yellow-50 p-4 rounded">
                      <p className="font-medium">Recommended Fix:</p>
                      <p className="mt-1">The user ID in your session doesn't match the user ID in your database. To fix this, you can:</p>
                      
                      <div className="mt-3">
                        <p className="font-medium">Option 1: Update database user ID</p>
                        <pre className="bg-gray-100 p-2 text-sm rounded mt-1">
                          {`UPDATE "User" SET id = '${session.user.id}' WHERE email = '${session.user.email}';`}
                        </pre>
                      </div>
                      
                      <div className="mt-3">
                        <p className="font-medium">Option 2: Use database ID in your API</p>
                        <pre className="bg-gray-100 p-2 text-sm rounded mt-1">
                          {`// Find user by email first
const { data: user } = await supabase
  .from('User')
  .select('id')
  .eq('email', session.user.email)
  .single();

// Then use user.id instead of session.user.id
const alertData = {
  userId: user.id,
  // Other alert fields...
};`}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Sample Users */}
            {results.sampleUsers && results.sampleUsers.length > 0 && (
              <div>
                <h3 className="font-medium text-lg border-b pb-2 mb-2">Sample Users in Database</h3>
                <table className="min-w-full mt-2">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.sampleUsers.map((user: any, index: number) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-mono text-sm">{user.id}</td>
                        <td className="p-2">{user.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}