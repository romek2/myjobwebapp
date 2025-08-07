'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Clock, CreditCard, Calendar, RefreshCw, Settings, Shield } from 'lucide-react';
import { useProAccess } from '@/lib/subscription';

export default function ManageSubscriptionsPage() {
  const { data: session, status } = useSession();
  const isPro = useProAccess();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/api/auth/signin?callbackUrl=/subscriptions');
    }

    // Fetch subscription details
    if (session?.user) {
      // In a real implementation, you would fetch subscription details from an API
      // Here we'll use the session data to simulate subscription details
      if (session.user.subscriptionStatus === 'PRO') {
        setSubscriptionDetails({
          status: 'active',
          plan: 'PRO',
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          paymentMethod: '**** **** **** 4242',
          price: '$4.99',
          billingCycle: 'monthly',
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
        });
      }
    }
  }, [status, session]);

  const handleManageSubscription = async () => {
    try {
      setIsManagingSubscription(true);
      setError(null);
      
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        setError("Unable to open subscription management portal. Please try again.");
        console.error("Failed to create portal session:", data.error);
      }
    } catch (error: any) {
      setError(`Something went wrong: ${error.message}`);
      console.error("Error managing subscription:", error);
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const handleUpgradeToPro = async () => {
    try {
      setIsUpgrading(true);
      setError(null);
      
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setError("Unable to start checkout process. Please try again.");
        console.error("Failed to create checkout session:", data.error);
      }
    } catch (error: any) {
      setError(`Something went wrong: ${error.message}`);
      console.error("Error subscribing:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Subscription</h1>
      
      {/* Error message display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!session ? (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign in to manage your subscription</h1>
          <p className="mb-6 text-gray-600">Please sign in to view and manage your subscription details.</p>
          <Link href="/api/auth/signin?callbackUrl=/subscriptions" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg">
            Sign In
          </Link>
        </div>
      ) : isPro ? (
        <>
          {/* PRO Subscription Details */}
          <div className="mb-6 inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Active PRO Subscription
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Your current subscription plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm text-gray-500 font-medium mb-1">Current Plan</h3>
                      <p className="flex items-center text-lg font-semibold text-green-700">
                        <Shield className="h-5 w-5 mr-2" />
                        Workr PRO
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm text-gray-500 font-medium mb-1">Status</h3>
                      <p className="flex items-center font-medium text-green-700">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Active
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm text-gray-500 font-medium mb-1">Billing Cycle</h3>
                      <p className="flex items-center">
                        <RefreshCw className="h-4 w-4 mr-2 text-gray-600" />
                        {subscriptionDetails.billingCycle.charAt(0).toUpperCase() + subscriptionDetails.billingCycle.slice(1)}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm text-gray-500 font-medium mb-1">Price</h3>
                      <p className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-gray-600" />
                        {subscriptionDetails.price}/{subscriptionDetails.billingCycle === 'monthly' ? 'month' : 'year'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm text-gray-500 font-medium mb-1">Start Date</h3>
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                        {formatDate(subscriptionDetails.startDate)}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm text-gray-500 font-medium mb-1">Next Renewal</h3>
                      <p className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-600" />
                        {formatDate(subscriptionDetails.renewalDate)}
                      </p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <h3 className="text-sm text-gray-500 font-medium mb-1">Payment Method</h3>
                      <p className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-gray-600" />
                        Visa ending in {subscriptionDetails.paymentMethod.slice(-4)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleManageSubscription}
                      disabled={isManagingSubscription}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isManagingSubscription ? 
                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading...</> : 
                        'Manage Payment Details'
                      }
                    </Button>
                    <p className="mt-2 text-sm text-gray-500">
                      You'll be redirected to a secure portal to manage your payment methods, update billing information, or cancel your subscription.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                  <p>Loading subscription details...</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>PRO Benefits</CardTitle>
              <CardDescription>
                Features included with your PRO subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Resume analysis</span>
                    <p className="text-sm text-gray-600">Optimize your resume for ATS systems and get detailed feedback</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Custom job alerts</span>
                    <p className="text-sm text-gray-600">Get notified about new job postings matching your criteria</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Advanced filters</span>
                    <p className="text-sm text-gray-600">Filter jobs by tech stack, salary range, and more</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Early access</span>
                    <p className="text-sm text-gray-600">Get early access to premium job listings</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Priority support</span>
                    <p className="text-sm text-gray-600">Get faster responses from our support team</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-6">
              <h3 className="font-medium text-blue-800 mb-2">Cancellation Policy</h3>
              <p className="text-gray-700 mb-3">
                You can cancel your subscription at any time. If you cancel, you'll continue to have access to PRO features until the end of your current billing period.
              </p>
              <p className="text-gray-700">
                To cancel, click the "Manage Payment Details" button above and select "Cancel subscription" in the payment portal.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* FREE Plan View */}
          <div className="mb-6 inline-flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Free Plan
          </div>
          
          <Card className="mb-8 border border-blue-200 shadow-sm">
            <CardHeader>
              <CardTitle>Upgrade to PRO</CardTitle>
              <CardDescription>
                Get access to premium features to boost your job search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">PRO Plan</h3>
                    <p className="text-gray-600">Unlock all premium features</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">$9.99</p>
                    <p className="text-gray-600">per month</p>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <span className="font-medium">Resume analysis</span>
                      <p className="text-sm text-gray-600">Optimize your resume for ATS systems</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <span className="font-medium">Custom job alerts</span>
                      <p className="text-sm text-gray-600">Get notified about relevant opportunities</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <span className="font-medium">Advanced filters</span>
                      <p className="text-sm text-gray-600">Filter jobs by tech stack, salary range, and more</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <span className="font-medium">Early access</span>
                      <p className="text-sm text-gray-600">Get early access to premium job listings</p>
                    </div>
                  </li>
                </ul>
                
                <Button
                  onClick={handleUpgradeToPro}
                  disabled={isUpgrading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {isUpgrading ? 
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 
                    'Upgrade to PRO'
                  }
                </Button>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  Cancel anytime. No long-term commitment required.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-3">Compare Plans</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider">Feature</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 tracking-wider">Free</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-blue-600 tracking-wider">PRO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Basic Job Search</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Resume Upload</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Resume Analysis</td>
                      <td className="px-4 py-3 text-center text-gray-400">✗</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Job Alerts</td>
                      <td className="px-4 py-3 text-center text-gray-400">✗</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                    </tr>

                    
                

                
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Early Access to Jobs</td>
                      <td className="px-4 py-3 text-center text-gray-400">✗</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Priority Support</td>
                      <td className="px-4 py-3 text-center text-gray-400">✗</td>
                      <td className="px-4 py-3 text-center text-green-600">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <Link href="/pricing" className="text-blue-600 hover:text-blue-800 font-medium">
                  View detailed pricing information
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}