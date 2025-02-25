// src/components/user-profile.tsx
'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserProfile() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <p>{session.user?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <p>{session.user?.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}