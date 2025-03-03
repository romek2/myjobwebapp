'use client';

// components/AdvancedJobAnalysis.tsx
import { useProAccess } from '@/lib/subscription';
import { useState } from 'react';
import Link from 'next/link';

export default function AdvancedJobAnalysis({ jobId }: { jobId?: string }) {
  const isPro = useProAccess();
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runAnalysis = async () => {
    if (!isPro) return;
    
    setIsLoading(true);
    
    // Simulate an API call that would analyze the job
    setTimeout(() => {
      setAnalysisResult(
        "Based on our advanced analysis, this job listing shows high potential matching with your skills. The company typically responds to 78% of applicants and the average interview process takes 2 weeks. Recommended action: Apply within 3 days for optimal visibility."
      );
      setIsLoading(false);
    }, 1500);
  };

  if (!isPro) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-6">
        <h3 className="text-lg font-semibold mb-2">Advanced Job Analysis</h3>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-700">
            This feature requires a PRO subscription.
          </p>
        </div>
        <p className="text-gray-600 mb-4">
          Upgrade to PRO to unlock advanced job insights including:
        </p>
        <ul className="list-disc list-inside text-gray-600 mb-4">
          <li>Company response rate statistics</li>
          <li>Personalized match scoring</li>
          <li>Optimal application timing</li>
          <li>Interview process duration estimates</li>
        </ul>
        <Link
          href="/pricing"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Upgrade to PRO
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">Advanced Job Analysis</h3>
      
      {!analysisResult && !isLoading && (
        <button
          onClick={runAnalysis}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Run Advanced Analysis
        </button>
      )}
      
      {isLoading && (
        <div className="flex items-center text-gray-600">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Analyzing job details...
        </div>
      )}
      
      {analysisResult && (
        <div className="bg-blue-50 p-4 rounded border border-blue-100">
          <h4 className="font-medium text-blue-800 mb-2">Analysis Results:</h4>
          <p className="text-gray-700">{analysisResult}</p>
        </div>
      )}
      
      <div className="mt-4 flex items-center">
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
          PRO Feature
        </span>
      </div>
    </div>
  );
}