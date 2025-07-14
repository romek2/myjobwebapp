// components/profile/ProfileHeader.tsx
'use client';

import { Session } from 'next-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Star } from 'lucide-react';

interface ProfileHeaderProps {
  session: Session | null;
  checkoutStatus: string | null;
  isPro: boolean;
}

export default function ProfileHeader({ session, checkoutStatus, isPro }: ProfileHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Profile Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checkout Status Messages */}
        {checkoutStatus === "success" && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your subscription was successful! You now have PRO access.
            </AlertDescription>
          </Alert>
        )}
        
        {checkoutStatus === "cancel" && (
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your subscription process was canceled.
            </AlertDescription>
          </Alert>
        )}

        {/* User Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src={session?.user?.image || ''} />
            <AvatarFallback className="text-lg">
              {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold break-words">
              {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-gray-500 break-all text-sm sm:text-base">{session?.user?.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Plan:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isPro 
                  ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {isPro ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    PRO
                  </span>
                ) : (
                  "FREE"
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}