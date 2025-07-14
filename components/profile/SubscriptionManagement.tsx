// components/profile/SubscriptionManagement.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Star, 
  RefreshCw, 
  CheckCircle 
} from 'lucide-react';

interface SubscriptionManagementProps {
  isPro: boolean;
  isSubscribing: boolean;
  isManagingSubscription: boolean;
  onSubscribe: () => void;
  onManageSubscription: () => void;
}

export default function SubscriptionManagement({
  isPro,
  isSubscribing,
  isManagingSubscription,
  onSubscribe,
  onManageSubscription
}: SubscriptionManagementProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPro ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              <span className="font-medium">PRO Plan Active</span>
            </div>
            <p className="text-sm text-gray-600">
              You have access to all premium features including AI matching and resume analysis.
            </p>
            <Button
              onClick={onManageSubscription}
              disabled={isManagingSubscription}
              variant="outline"
              className="w-full"
            >
              {isManagingSubscription ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Manage Subscription"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Upgrade to PRO</h3>
              <p className="text-sm text-gray-600 mb-3">
                Unlock premium features to supercharge your job search.
              </p>
              <ul className="text-sm space-y-1 text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>AI-powered job matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Resume ATS analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Custom job alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <Button
                onClick={onSubscribe}
                disabled={isSubscribing}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium"
              >
                {isSubscribing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Upgrade to PRO
                  </>
                )}
              </Button>
              <Button
                onClick={() => router.push("/pricing")}
                variant="outline"
                className="w-full"
              >
                View Plans
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}