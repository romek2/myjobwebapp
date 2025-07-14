// components/profile/JobAlerts.tsx - FIXED: Removed duplicate interface
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Plus, 
  PauseCircle, 
  PlayCircle, 
  Trash2 
} from 'lucide-react';
import { JobAlert } from '@/types';  // ✅ Import from shared types instead of defining locally

interface JobAlertsProps {
  isPro: boolean;
  jobAlerts: JobAlert[];
  onToggleAlert: (alertId: string) => void;
  onDeleteAlert: (alertId: string) => void;
  onSubscribe: () => void;
}

export default function JobAlerts({
  isPro,
  jobAlerts,
  onToggleAlert,
  onDeleteAlert,
  onSubscribe
}: JobAlertsProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Job Alerts
          {isPro && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
              PRO
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Get notified about jobs matching your criteria
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPro ? (
          <div className="space-y-4">
            {jobAlerts.length > 0 ? (
              <>
                <div className="space-y-3">
                  {jobAlerts.map((alert) => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm break-words">{alert.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{alert.keywords}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400 capitalize">{alert.frequency}</span>
                            {/* ✅ FIXED: Use createdAt from shared types instead of lastMatch */}
                            <span className="text-xs text-green-600">
                              Created: {new Date(alert.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onToggleAlert(alert.id)}
                            className={`p-1 rounded ${
                              alert.active ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title={alert.active ? 'Pause alert' : 'Resume alert'}
                          >
                            {alert.active ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => onDeleteAlert(alert.id)}
                            className="p-1 text-red-400 hover:text-red-600 rounded"
                            title="Delete alert"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={() => router.push("/alerts")}
                    variant="outline" 
                    className="w-full text-sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Alert
                  </Button>
                  <Button 
                    onClick={() => router.push("/alerts")}
                    variant="link" 
                    className="w-full text-blue-600 hover:text-blue-700 text-sm h-auto p-0"
                  >
                    Manage All Alerts →
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 space-y-3">
                <Bell className="h-8 w-8 mx-auto text-gray-400" />
                <div>
                  <h4 className="font-medium text-sm">No alerts set up</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Create alerts to get notified about relevant job opportunities
                  </p>
                </div>
                <Button 
                  onClick={() => router.push("/alerts")}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create First Alert
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Job Alerts</h4>
              <p className="text-xs text-gray-500 mt-1">
                Upgrade to PRO to create custom job alerts and never miss an opportunity
              </p>
            </div>
            <Button 
              onClick={onSubscribe}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs"
            >
              Upgrade to PRO
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}