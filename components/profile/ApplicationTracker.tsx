// components/profile/ApplicationTracker.tsx - REWRITTEN FROM SCRATCH
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Clock,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  applicationUrl?: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedDate: string;
  notes?: string;
  salary?: string;
}

export default function ApplicationTracker() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  // Load applications on component mount
  useEffect(() => {
    loadApplications();
  }, [session]);

  const loadApplications = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Try to load from localStorage first (for demo purposes)
      const savedApps = localStorage.getItem(`applications_${session.user.id}`);
      if (savedApps) {
        setApplications(JSON.parse(savedApps));
      }
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/applications');
      // const data = await response.json();
      // setApplications(data.applications);
      
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApplications = (apps: Application[]) => {
    if (session?.user) {
      localStorage.setItem(`applications_${session.user.id}`, JSON.stringify(apps));
      setApplications(apps);
    }
  };

  const addApplication = (appData: Omit<Application, 'id'>) => {
    const newApp: Application = {
      ...appData,
      id: Date.now().toString(),
    };
    const updatedApps = [newApp, ...applications];
    saveApplications(updatedApps);
    setShowAddForm(false);
  };

  const updateApplication = (updatedApp: Application) => {
    const updatedApps = applications.map(app => 
      app.id === updatedApp.id ? updatedApp : app
    );
    saveApplications(updatedApps);
    setEditingApp(null);
  };

  const deleteApplication = (id: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      const updatedApps = applications.filter(app => app.id !== id);
      saveApplications(updatedApps);
    }
  };

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-yellow-100 text-yellow-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadApplications}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : applications.length > 0 ? (
          <div className="space-y-4">
            {/* Application List */}
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 break-words text-sm sm:text-base">
                        {app.jobTitle}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Building className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="break-words">{app.company}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                        {app.location && (
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {app.location}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Applied {new Date(app.appliedDate).toLocaleDateString()}
                        </span>
                        {app.applicationUrl && (
                          <a 
                            href={app.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </a>
                        )}
                      </div>
                      {app.notes && (
                        <p className="text-xs text-gray-600 mt-2 italic">"{app.notes}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingApp(app)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteApplication(app.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {applications.length > 5 && (
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
              Start tracking your job applications to stay organized and follow up effectively.
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Application
            </Button>
          </div>
        )}

     
      </CardContent>
    </Card>
  );
}

// Form Component
interface ApplicationFormProps {
  application?: Application | null;
  onSave: (app: Application | Omit<Application, 'id'>) => void;
  onCancel: () => void;
}

function ApplicationForm({ application, onSave, onCancel }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    jobTitle: application?.jobTitle || '',
    company: application?.company || '',
    location: application?.location || '',
    applicationUrl: application?.applicationUrl || '',
    status: application?.status || 'applied' as Application['status'],
    appliedDate: application?.appliedDate || new Date().toISOString().split('T')[0],
    notes: application?.notes || '',
    salary: application?.salary || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.jobTitle.trim() || !formData.company.trim()) {
      alert('Job title and company are required');
      return;
    }

    if (application) {
      onSave({ ...application, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {application ? 'Edit Application' : 'Add New Application'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company *
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., San Francisco, CA or Remote"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application URL
            </label>
            <input
              type="url"
              value={formData.applicationUrl}
              onChange={(e) => setFormData({...formData, applicationUrl: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as Application['status']})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applied Date
              </label>
              <input
                type="date"
                value={formData.appliedDate}
                onChange={(e) => setFormData({...formData, appliedDate: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary
            </label>
            <input
              type="text"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., $80,000 - $100,000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Any notes about the application..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {application ? 'Update' : 'Add'} Application
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}