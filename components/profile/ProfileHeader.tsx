// components/profile/ProfileHeader.tsx - Cool Modern Version
'use client';

import { Session } from 'next-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Star, Crown, User, Sparkles, TrendingUp } from 'lucide-react';

interface ProfileHeaderProps {
  session: Session | null;
  checkoutStatus: string | null;
  isPro: boolean;
}

export default function ProfileHeader({ session, checkoutStatus, isPro }: ProfileHeaderProps) {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/5 overflow-hidden">
      {/* Checkout Status Messages */}
      {checkoutStatus === "success" && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">Subscription Successful! 🎉</h3>
              <p className="text-green-100 text-sm">You now have PRO access to all premium features.</p>
            </div>
          </div>
        </div>
      )}
      
      {checkoutStatus === "cancel" && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">Subscription Canceled</h3>
              <p className="text-yellow-100 text-sm">Your subscription process was canceled.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white/10 rounded-full"></div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4 mr-2" />
            Profile Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome Back!</h1>
          <p className="text-blue-100">Manage your profile and track your job search progress</p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Enhanced Avatar */}
          <div className="relative">
            <div className="relative">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white shadow-2xl">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              {isPro && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-pulse">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
              </h2>
              {isPro && (
                <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold rounded-full shadow-lg">
                  <Star className="w-4 h-4 mr-1" />
                  PRO MEMBER
                </span>
              )}
            </div>
            
            <p className="text-gray-600 break-all text-sm sm:text-base mb-4">{session?.user?.email}</p>
            
            {/* Enhanced Plan Display */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-700">Current Plan:</span>
                <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-300 ${
                  isPro 
                    ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200 shadow-md" 
                    : "bg-gray-100 text-gray-800 border-gray-200"
                }`}>
                  {isPro ? (
                    <span className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      PRO PLAN
                    </span>
                  ) : (
                    "FREE PLAN"
                  )}
                </span>
              </div>

              {isPro && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">All features unlocked</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">Premium support</span>
                  </div>
                </div>
              )}
            </div>

            {/* Account Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                <div className="text-lg font-bold text-blue-600">42</div>
                <div className="text-xs text-gray-600">Profile Views</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="text-lg font-bold text-green-600">8</div>
                <div className="text-xs text-gray-600">Applications</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="text-lg font-bold text-purple-600">95%</div>
                <div className="text-xs text-gray-600">Match Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}