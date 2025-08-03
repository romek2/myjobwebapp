'use client';

import { useState } from 'react';

export default function TestCompanyFlow() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/company-response', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to run test' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Test Company Response Flow</h1>
      
      <button 
        onClick={runTest}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Setting up test...' : 'Create Company Portal Test'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.testUrls?.companyPortal && (
            <div className="mt-4 space-y-2">
              <p className="font-semibold">🏢 Company Portal (click to test):</p>
              <a 
                href={result.testUrls.companyPortal}
                target="_blank"
                className="text-blue-600 hover:underline break-all"
              >
                {result.testUrls.companyPortal}
              </a>
              
              <p className="font-semibold mt-4">👤 Your Application Tracker:</p>
              <a 
                href="/profile"
                className="text-blue-600 hover:underline"
              >
                /profile
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}