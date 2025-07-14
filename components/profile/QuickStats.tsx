// components/profile/QuickStats.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Eye, 
  Briefcase, 
  Star, 
  Bell 
} from 'lucide-react';

interface JobAlert {
  id: string;
  active: boolean;
}

interface Application {
  id: string;
}

interface QuickStatsProps {
  applications: Application[];
  skillsCount: number;
  jobAlerts: JobAlert[];
  isPro: boolean;
}

export default function QuickStats({ 
  applications, 
  skillsCount, 
  jobAlerts, 
  isPro 
}: QuickStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Profile Views</span>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="font-medium">12</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Applications</span>
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4 text-green-500" />
              <span className="font-medium">{applications.length}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Skills Listed</span>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-purple-500" />
              <span className="font-medium">{skillsCount}</span>
            </div>
          </div>
          {isPro && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Alerts</span>
              <div className="flex items-center gap-1">
                <Bell className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{jobAlerts.filter(alert => alert.active).length}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}