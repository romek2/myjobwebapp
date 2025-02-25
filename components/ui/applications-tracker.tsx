// src/components/applications-tracker.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Application {
  id: string;
  job: {
    title: string;
    company: string;
  };
  status: string;
  createdAt: string;
}

export default function ApplicationsTracker() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/applications')
        .then(res => res.json())
        .then(data => setApplications(data));
    }
  }, [session]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Applications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map((app) => (
            <div 
              key={app.id} 
              className="flex justify-between items-center p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{app.job.title}</h3>
                <p className="text-sm text-gray-500">{app.job.company}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                  {app.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}