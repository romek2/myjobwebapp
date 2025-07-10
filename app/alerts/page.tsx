'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useProAccess } from '@/lib/subscription';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Plus, AlertCircle, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Alert {
  id: string;
  name: string;
  keywords: string;
  frequency: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function JobAlertsPage() {
  const { data: session } = useSession();
  const isPro = useProAccess();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewAlertForm, setShowNewAlertForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAlert, setNewAlert] = useState<{ name: string; keywords: string; frequency: string }>({ 
    name: '', 
    keywords: '', 
    frequency: 'daily' 
  });

  // Fetch alerts when component mounts
  useEffect(() => {
    async function fetchAlerts() {
      if (!session?.user || !isPro) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/alerts');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch alerts');
        }
        
        const data = await response.json();
        setAlerts(data);
      } catch (err: any) {
        console.error('Error fetching alerts:', err);
        setError('Failed to load your job alerts. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAlerts();
  }, [session, isPro]);

  const toggleAlert = async (id: string) => {
    if (!isPro) return;
    
    const alertToUpdate = alerts.find(alert => alert.id === id);
    if (!alertToUpdate) return;
    
    setError(null);
    
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          active: !alertToUpdate.active 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update alert');
      }
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === id ? { ...alert, active: !alert.active } : alert
      ));
    } catch (err: any) {
      setError(`Failed to update alert: ${err.message || 'Please try again.'}`);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!isPro) return;
    
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }
    
    setError(null);
    
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete alert');
      }
      
      // Update local state
      setAlerts(alerts.filter(alert => alert.id !== id));
    } catch (err: any) {
      setError(`Failed to delete alert: ${err.message || 'Please try again.'}`);
    }
  };

  const addNewAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPro) return;
    
    if (!newAlert.name.trim() || !newAlert.keywords.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAlert)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create alert');
      }
      
      const createdAlert = await response.json();
      
      // Update local state
      setAlerts([...alerts, createdAlert]);
      setNewAlert({ name: '', keywords: '', frequency: 'daily' });
      setShowNewAlertForm(false);
    } catch (err: any) {
      setError(`Failed to create alert: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign in to manage job alerts</h1>
          <p className="mb-6 text-gray-600">Create personalized job alerts to get notified about new opportunities.</p>
          <Link href="/api/auth/signin" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // PRO Feature upgrade prompt
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Job Alerts</h1>
        
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <span className="inline-block p-3 rounded-full bg-yellow-100 text-yellow-800 mb-4">
                <Bell className="h-6 w-6" />
              </span>
              <h2 className="text-2xl font-bold mb-2">Premium Job Alerts</h2>
              <p className="text-gray-600 mb-6">
                Upgrade to PRO to receive personalized job alerts for premium opportunities.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold mb-4">With PRO job alerts, you'll get:</h3>
              <ul className="text-left space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Early access to premium job listings
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Custom alert frequencies (daily, weekly, real-time)
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Salary range filters and company type preferences
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced keyword and technology matching
                </li>
              </ul>
            </div>
            
            <Link href="/pricing" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg inline-block">
              Upgrade to PRO
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Alerts</h1>
        <Button 
          onClick={() => setShowNewAlertForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Create New Alert
        </Button>
      </div>
      
      {/* PRO badge */}
      <div className="mb-6 inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        PRO Feature Enabled
      </div>
      
      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {showNewAlertForm && (
        <Card className="mb-6 border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>
              Set up alerts for jobs matching your preferred criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addNewAlert}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                    Alert Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={newAlert.name}
                    onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g., Senior React Developer"
                    required
                  />
                </div>
                
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="keywords">
                    Keywords (comma separated)
                  </label>
                  <input
                    id="keywords"
                    type="text"
                    value={newAlert.keywords}
                    onChange={(e) => setNewAlert({...newAlert, keywords: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g., React, TypeScript, Remote"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter keywords related to job titles, skills, or locations
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="frequency">
                    Alert Frequency
                  </label>
                  <select
                    id="frequency"
                    value={newAlert.frequency}
                    onChange={(e) => setNewAlert({...newAlert, frequency: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="realtime">Real-time</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewAlertForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Alert'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading your alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No alerts yet</h3>
            <p className="text-gray-600 mb-4">
              You don't have any job alerts set up. Create your first alert to get notified about relevant opportunities.
            </p>
            <Button 
              onClick={() => setShowNewAlertForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Your First Alert
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Alerts</h2>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${alert.active ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{alert.name}</h3>
                      <div className="mt-1 space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Keywords:</span> {alert.keywords}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={`capitalize px-2 py-0.5 rounded-full ${
                            alert.frequency === 'realtime' 
                              ? 'bg-blue-100 text-blue-800' 
                              : alert.frequency === 'daily'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {alert.frequency}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            alert.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {alert.active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAlert(alert.id)}
                        title={alert.active ? "Pause alert" : "Activate alert"}
                      >
                        {alert.active ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete alert"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <Card className="mt-8 bg-blue-50 border-blue-100">
        <CardContent className="p-6">
          <h3 className="font-medium text-blue-800 mb-2">About Premium Job Alerts</h3>
          <p className="text-gray-700 mb-2">
            As a PRO subscriber, you'll receive notifications for premium job listings that match your alert criteria.
            Our system prioritizes high-quality opportunities and exclusive positions not available to free users.
          </p>
          <p className="text-gray-700">
            You can create up to 3 custom alerts with different criteria and notification frequencies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}