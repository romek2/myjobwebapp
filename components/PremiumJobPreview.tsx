'use client';

// components/PremiumJobPreview.tsx
import { useProAccess } from '@/lib/subscription';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const PREMIUM_JOBS = [
  {
    id: 'pj1',
    title: 'Senior React Developer',
    company: 'Tech Unicorn Inc.',
    location: 'Remote (US)',
    salary: '$150K - $180K',
    postedAt: '2 hours ago'
  },
  {
    id: 'pj2',
    title: 'Lead Frontend Architect',
    company: 'Fortune 100 Company',
    location: 'USA',
    salary: '$170K - $200K',
    postedAt: '1 day ago'
  },
  {
    id: 'pj3',
    title: 'Principal UI Engineer',
    company: 'Stealth Startup',
    location: 'San Francisco, CA',
    salary: '$160K - $190K + equity',
    postedAt: '3 days ago'
  }
];

export default function PremiumJobPreview() {
  const isPro = useProAccess();
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  
  // In a real app, you would fetch this from your API
  useEffect(() => {
    // Simulate fetching alert status
    setTimeout(() => {
      setAlertsEnabled(isPro);
    }, 500);
  }, [isPro]);
  
  if (!isPro) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="mr-3 bg-yellow-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Premium Job Alerts</h3>
        </div>
        
        <div className="mb-4 relative overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-gray-800/30 to-transparent z-10"></div>
          <div className="relative grid gap-2 p-4 bg-white border border-gray-200 rounded-lg">
            {PREMIUM_JOBS.slice(0, 2).map(job => (
              <div key={job.id} className="blur-sm">
                <div className="text-sm font-semibold truncate">{job.title}</div>
                <div className="text-xs text-gray-500">{job.company} • {job.location}</div>
              </div>
            ))}
            <div className="text-center text-sm font-medium text-gray-500 mt-2 blur-sm">
              + 15 more premium listings this week
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center p-4">
              <span className="inline-block px-2 py-1 bg-gray-800 text-white text-xs font-semibold rounded mb-2">PRO FEATURE</span>
              <p className="text-white text-sm mb-3">Unlock premium job listings and alerts</p>
              <Link href="/pricing" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
                Upgrade to PRO
              </Link>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          PRO subscribers receive exclusive alerts for premium jobs, typically offering higher salaries and better benefits.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="mr-3 bg-blue-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Premium Job Alerts</h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">PRO Feature</span>
          </div>
        </div>
        
        <div className="relative inline-block w-12 mr-2 align-middle select-none">
          <input
            type="checkbox"
            id="toggle-alerts"
            checked={alertsEnabled}
            onChange={() => setAlertsEnabled(!alertsEnabled)}
            className="sr-only"
          />
          <label
            htmlFor="toggle-alerts"
            className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
              alertsEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                alertsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></span>
          </label>
        </div>
      </div>
      
      <div className="grid gap-3 mb-4">
        {PREMIUM_JOBS.map(job => (
          <div key={job.id} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{job.title}</div>
                <div className="text-sm text-gray-600">{job.company} • {job.location}</div>
              </div>
              <div className="text-sm font-semibold text-green-600">{job.salary}</div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">{job.postedAt}</span>
              <div className="flex space-x-2">
                <Link href={`/jobs/${job.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {alertsEnabled ? 'You will receive alerts for premium jobs' : 'Alerts are currently disabled'}
        </span>
        <Link href="/alerts" className="text-sm text-blue-600 hover:text-blue-800">
          Manage Alerts
        </Link>
      </div>
    </div>
  );
}