// components/profile/ApplicationTracker.tsx - FIXED VERSION WITH BLUR FEATURE
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Clock,
  ExternalLink,
  RefreshCw,
  Bell,
  Eye,
  EyeOff,
  Calendar,
  CheckCircle,
  XCircle,
  Star,
  Lock,
  Unlock
} from 'lucide-react';

interface Application {
  id: string | number; // ✅ FIXED: Handle both types
  job_id: string;
  job_title: string;
  company: string;
  status: 'applied' | 'under_review' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  applied_at: string;
  status_updated_at?: string;
  desired_salary?: number;
  available_start_date?: string;
  cover_letter?: string;
  resume_file_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  phone?: string;
  company_notes?: string;
  interview_date?: string;
  interviewer_name?: string;
  interview_location?: string;
}

interface Notification {
  id: string | number; // ✅ FIXED: Handle both types
  application_id: string | number; // ✅ FIXED: Handle both types
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  requires_pro: boolean;
  is_blurred?: boolean;
  created_at: string;
  metadata?: any;
}

// ✅ FIXED: Helper function to safely convert ID to string
const safeIdToString = (id: string | number | undefined | null): string => {
  if (id === undefined || id === null) return '';
  return String(id);
};

export default function ApplicationTracker() {
  const { data: session } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  // Load applications and notifications
  const loadData = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Load applications
      const appsResponse = await fetch('/api/applications');
      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        setApplications(appsData.applications || []);
      }

      // Load notifications
      const notificationsResponse = await fetch('/api/notifications');
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.notifications || []);
        setIsPro(notificationsData.isPro || false);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const markNotificationAsRead = async (notificationId: string | number) => {
    try {
      const idString = safeIdToString(notificationId);
      await fetch(`/api/notifications/${idString}/read`, { method: 'POST' });
      setNotifications(prev => 
        prev.map(notification => 
          safeIdToString(notification.id) === idString
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'under_review': return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'interview': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'offer': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'hired': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationNotifications = (applicationId: string | number) => {
    const appIdString = safeIdToString(applicationId);
    return notifications.filter(n => safeIdToString(n.application_id) === appIdString);
  };

  if (!session) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Sign in to track applications</h3>
          <p className="text-gray-600">Keep track of your job applications and their status.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Applications
              {applications.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {applications.length}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Track your job applications and their status
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isPro && (
              <Button
                onClick={() => router.push('/pricing')}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <Star className="h-4 w-4 mr-1" />
                Upgrade
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error loading applications:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading applications...</span>
          </div>
        ) : applications.length > 0 ? (
          <div className="space-y-4">
            {applications.slice(0, 10).map((app) => {
              const appNotifications = getApplicationNotifications(app.id);
              const unreadNotifications = appNotifications.filter(n => !n.is_read);
              
              return (
                <div key={safeIdToString(app.id)} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 break-words text-sm sm:text-base">
                          {app.job_title}
                        </h4>
                        {unreadNotifications.length > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            {unreadNotifications.length}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center">
                          <Building className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="break-words">{app.company}</span>
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Applied {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {app.status_updated_at && app.status !== 'applied' && (
                          <span className="text-xs text-gray-500">
                            Updated {new Date(app.status_updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Notifications for this application */}
                      {appNotifications.length > 0 && (
                        <div className="space-y-2">
                          {appNotifications.slice(0, 3).map((notification) => (
                            <div 
                              key={safeIdToString(notification.id)} // ✅ FIXED: Safe ID conversion
                              className={`p-3 rounded-lg border text-sm ${
                                notification.is_read 
                                  ? 'bg-gray-50 border-gray-200' 
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                              onClick={() => {
                                if (!notification.is_read) {
                                  markNotificationAsRead(notification.id);
                                }
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-gray-900">
                                      {notification.is_blurred ? (
                                        <span className="flex items-center gap-1">
                                          <Lock className="h-3 w-3" />
                                          {notification.title}
                                        </span>
                                      ) : (
                                        notification.title
                                      )}
                                    </p>
                                    {!notification.is_read && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    )}
                                  </div>
                                  
                                  {notification.is_blurred ? (
                                    <div className="relative">
                                      <p className="text-gray-600 blur-sm select-none">
                                        This is important information about your application status that you can see with PRO
                                      </p>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            router.push('/pricing');
                                          }}
                                          size="sm"
                                          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-3 py-1 h-auto"
                                        >
                                          <Unlock className="h-3 w-3 mr-1" />
                                          Upgrade to Read
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-600">{notification.message}</p>
                                  )}
                                </div>
                                
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Show additional interview details for PRO users */}
                              {!notification.is_blurred && 
                               notification.metadata?.interviewDate && (
                                <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                  <div className="flex items-center gap-1 text-xs text-purple-800 font-medium mb-1">
                                    <Calendar className="h-3 w-3" />
                                    Interview Details
                                  </div>
                                  <div className="text-xs text-purple-700 space-y-1">
                                    <p>📅 {new Date(notification.metadata.interviewDate).toLocaleString()}</p>
                                    {notification.metadata.interviewer && (
                                      <p>👤 {notification.metadata.interviewer}</p>
                                    )}
                                    {notification.metadata.location && (
                                      <p>📍 {notification.metadata.location}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {appNotifications.length > 3 && (
                            <button className="text-xs text-blue-600 hover:underline">
                              View {appNotifications.length - 3} more updates
                            </button>
                          )}
                        </div>
                      )}

                      {/* Application details for PRO users or basic info for free users */}
                      {(isPro || app.status === 'applied') && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                          {app.desired_salary && (
                            <span>Salary: ${app.desired_salary.toLocaleString()}</span>
                          )}
                          {app.available_start_date && (
                            <span>Available: {new Date(app.available_start_date).toLocaleDateString()}</span>
                          )}
                          {app.resume_file_url && (
                            <a 
                              href={app.resume_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Resume
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 self-start">
                      {isPro && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          PRO
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {applications.length > 10 && (
              <div className="text-center pt-2">
                <Button variant="outline">
                  View All {applications.length} Applications
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              When you apply to jobs, they'll appear here so you can track their status.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Try applying to some jobs to see them tracked here!
              </p>
              {!isPro && (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 mt-4">
                  <p className="text-sm text-purple-800 mb-2">
                    <Lock className="h-4 w-4 inline mr-1" />
                    <strong>PRO Users Get:</strong>
                  </p>
                  <ul className="text-xs text-purple-700 space-y-1">
                    <li>• Real-time status updates from employers</li>
                    <li>• Interview scheduling notifications</li>
                    <li>• Company feedback and notes</li>
                    <li>• Detailed application timeline</li>
                  </ul>
                  <Button
                    onClick={() => router.push('/pricing')}
                    size="sm"
                    className="mt-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs"
                  >
                    Upgrade to PRO
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRO upgrade prompt for free users with applications */}
        {!isPro && applications.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-purple-900 mb-1">
                  Unlock Full Application Insights
                </h4>
                <p className="text-sm text-purple-700 mb-3">
                  See detailed status updates, company responses, interview schedules, and more with PRO.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => router.push('/pricing')}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    Upgrade to PRO
                  </Button>
                  <span className="text-xs text-purple-600 self-center">
                    Starting at $4.99/month
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}