'use client';

// app/alerts/page.tsx
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useProAccess } from '@/lib/subscription';
import Link from 'next/link';

export default function JobAlertsPage() {
  const { data: session } = useSession();
  const isPro = useProAccess();
  const [alerts, setAlerts] = useState([
    { id: 1, name: 'Frontend Developer', keywords: 'React, TypeScript, Next.js', frequency: 'daily', active: true },
    { id: 2, name: 'Backend Developer', keywords: 'Node.js, Express, PostgreSQL', frequency: 'weekly', active: false },
  ]);
  const [showNewAlertForm, setShowNewAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState({ name: '', keywords: '', frequency: 'daily' });

  const toggleAlert = (id: number) => {
    if (!isPro) return;
    
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ));
  };

  const deleteAlert = (id: number) => {
    if (!isPro) return;
    
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const addNewAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro) return;
    
    const id = Math.max(0, ...alerts.map(a => a.id)) + 1;
    setAlerts([...alerts, { id, active: true, ...newAlert }]);
    setNewAlert({ name: '', keywords: '', frequency: 'daily' });
    setShowNewAlertForm(false);
  };

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

  // PRO Feature upgrade prompt
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Alerts</h1>
        <button 
          onClick={() => setShowNewAlertForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
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
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="frequency">Alert Frequency</label>
              <select
                id="frequency"
                value={newAlert.frequency}
                onChange={(e) => setNewAlert({...newAlert, frequency: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                required
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
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Create Alert
              </button>
            </div>
          </form>
        </div>
      )}
      
      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">You don't have any job alerts yet. Create your first alert to get started.</p>
        </div>
      ) : (
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
                      onClick={() => toggleAlert(alert.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      {alert.active ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-900"
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