// components/profile/QuickStats.tsx - Updated with real data
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  Send, 
  Bell, 
  User, 
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface QuickStatsProps {
  skillsCount: number;
  jobAlerts: any[];
  isPro: boolean;
}

interface StatsData {
  totalApplications: number;
  totalViews: number;
  isLoading: boolean;
  error: string | null;
}

export default function QuickStats({ skillsCount, jobAlerts, isPro }: QuickStatsProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatsData>({
    totalApplications: 0,
    totalViews: 0,
    isLoading: true,
    error: null
  });

  const loadStats = async () => {
    if (!session?.user) {
      setStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch applications count
      const appsResponse = await fetch('/api/applications');
      let applicationCount = 0;
      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        applicationCount = appsData.applications?.length || 0;
      }

      // Fetch view count (if you have this API)
      let viewCount = 0;
      try {
        const viewsResponse = await fetch('/api/profile/view-count');
        if (viewsResponse.ok) {
          const viewsData = await viewsResponse.json();
          viewCount = viewsData.viewCount || 0;
        }
      } catch (viewError) {
        // If view count API doesn't exist, just use 0
        console.log('View count API not available');
      }

      setStats({
        totalApplications: applicationCount,
        totalViews: viewCount,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load stats'
      }));
    }
  };

  useEffect(() => {
    loadStats();
  }, [session]);

  const activeAlertsCount = jobAlerts.filter(alert => alert.active).length;

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-4">
            Sign in to see your stats
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Stats
          </CardTitle>
          <button
            onClick={loadStats}
            disabled={stats.isLoading}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className={`h-4 w-4 ${stats.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {stats.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Applications */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Send className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-semibold text-blue-600">
              {stats.isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                stats.totalApplications
              )}
            </div>
            <div className="text-xs text-gray-600">Applications</div>
          </div>

          {/* Job Views */}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Eye className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-semibold text-green-600">
              {stats.isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                stats.totalViews
              )}
            </div>
            <div className="text-xs text-gray-600">Job Views</div>
          </div>

          {/* Skills */}
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <User className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-lg font-semibold text-purple-600">
              {skillsCount}
            </div>
            <div className="text-xs text-gray-600">Skills</div>
          </div>

          {/* Job Alerts */}
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Bell className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-lg font-semibold text-orange-600">
              {activeAlertsCount}
            </div>
            <div className="text-xs text-gray-600">
              {isPro ? 'Active Alerts' : 'Alerts (PRO)'}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Profile Status:</span>
              <span className="font-medium">
                {isPro ? (
                  <span className="text-green-600">PRO</span>
                ) : (
                  <span className="text-gray-600">FREE</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Alerts:</span>
              <span className="font-medium">{jobAlerts.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}