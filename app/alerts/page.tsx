'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useProAccess } from '@/lib/subscription';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Plus, AlertCircle, PauseCircle, PlayCircle, Trash2, Sparkles, Zap, TrendingUp, Users, Crown, Star, ArrowRight, CheckCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

        <div className="relative max-w-4xl mx-auto p-6">
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-8 shadow-2xl">
              <Bell className="h-10 w-10 text-white animate-pulse" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Smart Job Alerts
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Get notified instantly when dream jobs matching your skills become available. 
              Never miss out on the perfect opportunity again.
            </p>
            
            <div className="inline-flex items-center space-x-4">
              <Link 
                href="/api/auth/signin" 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <Users className="w-5 h-5 mr-2" />
                Sign In to Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PRO Feature upgrade prompt
  if (!isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

        <div className="relative max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-12 pt-8">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 rounded-full text-yellow-800 text-sm font-medium mb-6">
              <Crown className="w-4 h-4 mr-2" />
              Premium Feature
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Job Alerts
            </h1>
          </div>

          {/* Main upgrade card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/10 overflow-hidden mb-8">
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 p-8 text-white">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
                <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full"></div>
                <div className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full"></div>
                <div className="absolute bottom-20 left-1/3 w-12 h-12 bg-white/5 rounded-full"></div>
                <div className="absolute bottom-40 right-10 w-8 h-8 bg-white/5 rounded-full"></div>
              </div>
              
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                  <Bell className="h-8 w-8 text-white animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Premium Job Alerts</h2>
                <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                  Upgrade to PRO to receive instant notifications for premium opportunities that match your exact criteria.
                </p>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Features */}
                <div>
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
                    Premium Features
                  </h3>
                  <div className="space-y-4">
                    {[
                      { icon: Zap, title: 'Real-time Notifications', desc: 'Get alerted within minutes of new job postings' },
                      { icon: TrendingUp, title: 'Smart Matching', desc: 'AI-powered job matching based on your profile' },
                      { icon: Star, title: 'Exclusive Access', desc: 'Early access to premium and hidden job listings' },
                      { icon: Crown, title: 'Priority Support', desc: 'Custom alert frequencies and advanced filters' }
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{title}</h4>
                          <p className="text-gray-600 text-sm">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
                    What You'll Get
                  </h3>
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6">
                    <ul className="space-y-3">
                      {[
                        'Up to 10 custom job alerts',
                        'Daily, weekly, or real-time notifications',
                        'Salary range and location filters',
                        'Company type and size preferences',
                        'Advanced keyword matching',
                        'Mobile push notifications',
                        'Email digest summaries',
                        'Priority customer support'
                      ].map((feature) => (
                        <li key={feature} className="flex items-center text-gray-700">
                          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to PRO
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <p className="text-gray-500 text-sm mt-4">Cancel anytime • 30-day money back guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

      <div className="relative max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pt-8">
          <div>
            <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-full text-green-800 text-xs font-medium mb-4">
              <Crown className="w-3 h-3 mr-1" />
              PRO Feature Active
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
              Job Alerts
            </h1>
            <p className="text-gray-600">Manage your personalized job notifications</p>
          </div>
          <Button 
            onClick={() => setShowNewAlertForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all duration-300 hover:scale-105 mt-4 sm:mt-0"
          >
            <Plus className="mr-2 h-4 w-4" /> Create New Alert
          </Button>
        </div>
        
        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50/50 backdrop-blur-sm border border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* New Alert Form */}
        {showNewAlertForm && (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/5 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Create New Alert</h3>
                  <p className="text-blue-100 text-sm">Set up alerts for jobs matching your criteria</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={addNewAlert}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="name">
                        Alert Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={newAlert.name}
                        onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                        placeholder="E.g., Senior React Developer"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="keywords">
                        Keywords (comma separated)
                      </label>
                      <input
                        id="keywords"
                        type="text"
                        value={newAlert.keywords}
                        onChange={(e) => setNewAlert({...newAlert, keywords: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                        placeholder="E.g., React, TypeScript, Remote"
                        required
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Enter keywords related to job titles, skills, or locations
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="frequency">
                        Alert Frequency
                      </label>
                      <select
                        id="frequency"
                        value={newAlert.frequency}
                        onChange={(e) => setNewAlert({...newAlert, frequency: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                        required
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="realtime">Real-time</option>
                      </select>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Pro Tip</h4>
                      <p className="text-sm text-gray-600">Use specific keywords to get more relevant matches. Real-time alerts notify you within minutes!</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewAlertForm(false)}
                    className="hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all duration-300 hover:scale-105"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-2" />
                        Create Alert
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Loading or Alerts List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/5">
            <div className="text-center p-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-6">
                <Bell className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">No alerts yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                You don't have any job alerts set up. Create your first alert to get notified about relevant opportunities.
              </p>
              <Button 
                onClick={() => setShowNewAlertForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Your First Alert
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Your Active Alerts</h2>
            <div className="grid gap-6">
              {alerts.map((alert) => (
                <div key={alert.id} className={`bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/5 overflow-hidden transition-all duration-300 hover:shadow-2xl ${alert.active ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-gray-300'}`}>
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.active ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gray-200'}`}>
                            <Bell className={`w-5 h-5 ${alert.active ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">{alert.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                alert.active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {alert.active ? 'Active' : 'Paused'}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                alert.frequency === 'realtime' 
                                  ? 'bg-red-100 text-red-800' 
                                  : alert.frequency === 'daily'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {alert.frequency}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Keywords:</p>
                          <div className="flex flex-wrap gap-2">
                            {alert.keywords.split(',').map((keyword, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                                {keyword.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAlert(alert.id)}
                          className={`hover:scale-105 transition-all duration-200 ${
                            alert.active 
                              ? 'hover:bg-orange-50 hover:border-orange-200' 
                              : 'hover:bg-green-50 hover:border-green-200'
                          }`}
                          title={alert.active ? "Pause alert" : "Activate alert"}
                        >
                          {alert.active ? 
                            <PauseCircle className="h-4 w-4 text-orange-600" /> : 
                            <PlayCircle className="h-4 w-4 text-green-600" />
                          }
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 hover:scale-105 transition-all duration-200"
                          title="Delete alert"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Info Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6 mt-8">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">About Premium Job Alerts</h3>
              <p className="text-gray-700 mb-2">
                As a PRO subscriber, you'll receive priority notifications for premium job listings that match your alert criteria.
                Our AI system learns from your preferences to deliver increasingly relevant opportunities.
              </p>
              <p className="text-gray-700">
                You can create up to 10 custom alerts with different criteria and notification frequencies. 
                Real-time alerts notify you within minutes of new postings!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}