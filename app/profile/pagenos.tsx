// src/app/profile/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/')
    }
  });

  if (status === "loading") {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="flex justify-center">
                Loading...
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback>
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-gray-500">{session?.user?.email}</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Your Resumes</h3>
                <div className="text-gray-500">
                  <p>No resumes uploaded yet</p>
                  <button className="mt-2 text-blue-500 hover:text-blue-600">
                    + Upload a Resume
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Job Applications</h3>
                <div className="text-gray-500">
                  <p>No applications submitted yet</p>
                  <button className="mt-2 text-blue-500 hover:text-blue-600">
                    + Start Applying
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Job Preferences</h3>
                <div className="space-y-2">
                  <p className="text-gray-500">Set your job preferences to get better matches</p>
                  <div className="space-y-1">
                    <p className="text-sm">Desired Role: Not set</p>
                    <p className="text-sm">Location: Not set</p>
                    <p className="text-sm">Experience Level: Not set</p>
                  </div>
                  <button className="text-blue-500 hover:text-blue-600">
                    Edit Preferences
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}