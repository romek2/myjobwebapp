'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useProAccess } from '@/lib/subscription';
import Link from 'next/link';

interface Alert {
  id: string;
  name: string;
  keywords: string;
  frequency: string;
  active: boolean;
  created_at?: string;
}

export default function JobAlertsPage() {
  const { data: session } = useSession();
  const isPro = useProAccess();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewAlertForm, setShowNewAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState({ name: '', keywords: '', frequency: 'daily' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch alerts from the database
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!session?.user) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/alerts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch alerts');
        }
        
        const data = await response.json();
        setAlerts(data);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError('Failed to load your job alerts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (session && isPro) {
      fetchAlerts();
    } else {
      setLoading(false);
    }
  }, [session, isPro]);

  // Toggle alert active state
  const toggleAlert = async (id: string) => {
    if (!isPro) return;
    
    try {
      const alertToUpdate = alerts.find(alert => alert.id === id);
      if (!alertToUpdate) return;
      
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          active: !alertToUpdate.active 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update alert');
      }
      
      // Update UI state
      setAlerts(alerts.map(alert => 
        alert.id === id ? { ...alert, active: !alert.active } : alert
      ));
      
      // Show success message
      setSuccessMessage(`Alert ${alertToUpdate.active ? 'paused' : 'activated'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error toggling alert:', err);
      setError('Failed to update the alert. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Delete an alert
  const deleteAlert = async (id: string) => {
    if (!isPro) return;
    
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }
      
      // Update UI state
      setAlerts(alerts.filter(alert => alert.id !== id));
      
      // Show success message
      setSuccessMessage('Alert deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting alert:', err);
      setError('Failed to delete the alert. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Add a new alert
  const addNewAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAlert.name,
          keywords: newAlert.keywords,
          frequency: newAlert.frequency,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create alert');
      }
      
      const createdAlert = await response.json();
      
      // Update UI state
      setAlerts([...alerts, createdAlert]);
      setNewAlert({ name: '', keywords: '', frequency: 'daily' });
      setShowNewAlertForm(false);
      
      // Show success message
      setSuccessMessage('Job alert created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error creating alert:', err);
      setError('Failed to create the alert. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test the alert
  const testAlert = async (id: string) => {
    if (!isPro) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/alerts/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alertId: id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to test alert');
      }
      
      const result = await response.json();
      
      // Show appropriate message based on result
      if (result.jobCount > 0) {
        setSuccessMessage(`Test successful! Found ${result.jobCount} matching jobs. Email sent.`);
      } else {
        setSuccessMessage('Test successful, but no matching jobs found.');
      }
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error testing alert:', err);
      setError('Failed to test the alert. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Render sign-in prompt if not logged in
  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Sign in to manage job alerts</h1>
          <p className="mb-6 text-gray-600">Create personalized job alerts to get notified about new opportunities.</p>
          <Link href="/api/auth/signin" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Render PRO Feature upgrade prompt if not a PRO user
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Job Alerts</h1>
        
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6 text-center">
          <div className="mb-4">
            <span className="inline-block p-3 rounded-full bg-yellow-100 text-yellow-800 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </span>
            <h2 className="text-2xl font-bold mb-2">Premium Job Alerts</h2>
            <p className="text-gray-600 mb-6">
              Upgrade to PRO to receive personalized job alerts for premium opportunities.
            </p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold mb-4">With PRO job alerts, you'll get:</h3>
            <ul className="text-left space-y-2 mb-6">
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
        </div>
      </div>
    );
  }

  // Main content for PRO users
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Alerts</h1>
        <button 
          onClick={() => setShowNewAlertForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          disabled={isSubmitting}
        >
          Create New Alert
        </button>
      </div>
      
      {/* PRO badge */}
      <div className="mb-6 inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        PRO Feature Enabled
      </div>
      
      {/* Success and error messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          {error}
        </div>
      )}
      
      {/* New alert form */}
      {showNewAlertForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Alert</h2>
          <form onSubmit={addNewAlert}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="name">Alert Name</label>
              <input
                id="name"
                type="text"
                value={newAlert.name}
                onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="keywords">Keywords (comma separated)</label>
              <input
                id="keywords"
                type="text"
                value={newAlert.keywords}
                onChange={(e) => setNewAlert({...newAlert, keywords: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                required
                disabled={isSubmitting}
                placeholder="e.g. React, Frontend, Remote"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter skills, job titles, or technologies you're interested in
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="frequency">Alert Frequency</label>
              <select
                id="frequency"
                value={newAlert.frequency}
                onChange={(e) => setNewAlert({...newAlert, frequency: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                required
                disabled={isSubmitting}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="realtime">Real-time</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewAlertForm(false)}
                className="py-2 px-4 border border-gray-300 rounded-lg"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Alert'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading your job alerts...</p>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && alerts.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
            />
          </svg>
          <p className="mt-2 text-gray-600">You don't have any job alerts yet. Create your first alert to get started.</p>
        </div>
      )}
      
      {/* Alerts table */}
      {!loading && alerts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keywords</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{alert.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{alert.keywords}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 capitalize">{alert.frequency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        alert.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {alert.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => testAlert(alert.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      disabled={loading || !alert.active}
                      title={alert.active ? "Test this alert now" : "Activate the alert to test it"}
                    >
                      Test
                    </button>
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      disabled={loading}
                    >
                      {alert.active ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Info box */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">About Premium Job Alerts</h3>
        <p className="text-gray-700 mb-2">
          As a PRO subscriber, you'll receive notifications for premium job listings that match your alert criteria.
          Our system prioritizes high-quality opportunities and exclusive positions not available to free users.
        </p>
        <p className="text-gray-700">
          You can create up to 10 custom alerts with different criteria and notification frequencies.
        </p>
      </div>
    </div>
  );
}