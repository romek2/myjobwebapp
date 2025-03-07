'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function DiagnosePage() {
  const { data: session } = useSession();
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDiagnostics() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/diagnose-fk');
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDiagnosticData(data);
      } catch (err) {
        console.error('Error fetching diagnostic data:', err);
        setError(err.message || 'Failed to load diagnostic data');
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchDiagnostics();
    }
  }, [session]);

  if (!session) {
    return <div className="p-8">Please sign in to access diagnostics</div>;
  }

  if (isLoading) {
    return <div className="p-8">Loading diagnostic data...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Diagnostic Results</h1>
      
      {diagnosticData && (
        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-blue-50">
            <h2 className="text-lg font-semibold mb-2">Session Information</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">User ID:</div>
              <div className="font-mono">{diagnosticData.session.userId}</div>
              
              <div className="font-medium">Email:</div>
              <div>{diagnosticData.session.email}</div>
              
              <div className="font-medium">Status:</div>
              <div>{diagnosticData.session.status || 'Not specified'}</div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-green-50">
            <h2 className="text-lg font-semibold mb-2">User Lookup Results</h2>
            
            <div className="mb-4">
              <h3 className="font-medium">Exact ID Match:</h3>
              {diagnosticData.exactMatch.found ? (
                <div className="text-green-700">
                  User found in database with exact ID match
                </div>
              ) : (
                <div className="text-red-700">
                  No user found with ID: {diagnosticData.session.userId}
                  {diagnosticData.exactMatch.error && (
                    <div className="text-sm mt-1">Error: {diagnosticData.exactMatch.error}</div>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-medium">Email Match:</h3>
              {diagnosticData.emailMatch.found ? (
                <div className="text-green-700">
                  User found by email: {diagnosticData.session.email}
                  <div className="text-sm mt-1 font-mono">
                    Database ID: {diagnosticData.emailMatch.user.id}
                  </div>
                </div>
              ) : (
                <div className="text-red-700">
                  No user found with email: {diagnosticData.session.email}
                  {diagnosticData.emailMatch.error && (
                    <div className="text-sm mt-1">Error: {diagnosticData.emailMatch.error}</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Sample Users in Database</h2>
            {diagnosticData.sampleUsers && diagnosticData.sampleUsers.length > 0 ? (
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosticData.sampleUsers.map((user, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 font-mono">{user.id}</td>
                      <td className="p-2">{user.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div>No sample users found</div>
            )}
          </div>
          
          <div className="border rounded-lg p-4 bg-yellow-50">
            <h2 className="text-lg font-semibold mb-2">Analysis</h2>
            <div className="p-3 bg-white rounded">
              <p className="font-medium text-lg mb-2">
                {diagnosticData.analysis.userIdMismatch ? 
                  "🔴 Problem detected: User ID mismatch" : 
                  "✅ User ID check passed"}
              </p>
              <p className="mb-4">{diagnosticData.analysis.possibleSolution}</p>
              
              {diagnosticData.analysis.emailFoundWithDifferentId && (
                <div className="p-3 bg-blue-50 rounded">
                  <h3 className="font-medium">Recommended Solution:</h3>
                  <p>Your NextAuth session uses ID <code className="bg-gray-100 px-1 rounded">{diagnosticData.session.userId}</code> but in your database, this user has ID <code className="bg-gray-100 px-1 rounded">{diagnosticData.emailMatch.user.id}</code>.</p>
                  
                  <div className="mt-4">
                    <p className="font-medium">Option 1: Update the user ID in your database</p>
                    <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto mt-1 text-sm">
                      {`UPDATE "User" SET id = '${diagnosticData.session.userId}' WHERE email = '${diagnosticData.session.email}';`}
                    </pre>
                  </div>
                  
                  <div className="mt-4">
                    <p className="font-medium">Option 2: Create JobAlert using the database ID</p>
                    <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto mt-1 text-sm">
                      {`// In your POST handler:
const dbUserId = '${diagnosticData.emailMatch.user.id}';
const alertData = {
  id: uuidv4(),
  userId: dbUserId,  // Use database ID instead of session ID
  name: name,
  // Other fields...
};`}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}