'use client';

import { useSession } from 'next-auth/react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function ProfileContent() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/')
    }
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  
  // Get checkout status from URL parameters
  const checkoutStatus = searchParams.get("checkout");

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true);
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
        console.error("Failed to create checkout session:", data.error);
        alert("Unable to start checkout process. Please try again.");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsManagingSubscription(true);
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
        console.error("Failed to create portal session:", data.error);
        alert("Unable to open subscription management. Please try again.");
      }
    } catch (error) {
      console.error("Error managing subscription:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsManagingSubscription(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="flex justify-center">
                Loading...
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Display checkout status messages */}
            {checkoutStatus === "success" && (
              <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                Your subscription was successful! You now have PRO access.
              </div>
            )}
            
            {checkoutStatus === "cancel" && (
              <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                Your subscription process was canceled.
              </div>
            )}

            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback>
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-gray-500">{session?.user?.email}</p>
                <p className="mt-2">
                  <span className="font-medium">Subscription:</span>{" "}
                  <span className={session?.user?.subscriptionStatus === "PRO" ? "text-green-600 font-semibold" : "text-gray-600"}>
                    {session?.user?.subscriptionStatus || "FREE"}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Subscription Management</CardTitle>
          </CardHeader>
          <CardContent>
            {session?.user?.subscriptionStatus === "PRO" ? (
              <div>
                <p className="mb-4">
                  You currently have a <span className="font-semibold text-green-600">PRO</span> subscription.
                </p>
                <Button
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isManagingSubscription ? "Loading..." : "Manage Subscription"}
                </Button>
              </div>
            ) : (
              <div>
                <p className="mb-4">Upgrade to PRO to unlock all features:</p>
                <ul className="list-disc ml-5 mb-4">
                  <li>Resume analysis and editing</li>
                  <li>Track job applications</li>
                  <li>Advanced job search filters</li>
                  <li>Unlimited saved jobs</li>
                  <li>Custom job alerts</li>
                </ul>
                <div className="flex space-x-4">
                  <Button
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium"
                  >
                    {isSubscribing ? "Loading..." : "Upgrade to PRO"}
                  </Button>
                  <Button
                    onClick={() => router.push("/pricing")}
                    variant="outline"
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    View Plans
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Management Cards */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Resumes</CardTitle>
              <CardDescription>Upload and manage your resumes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500">
                <p>No resumes uploaded yet</p>
                <Button variant="link" className="mt-2 text-blue-500 hover:text-blue-600 p-0">
                  + Upload a Resume
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Alerts</CardTitle>
              <CardDescription>Get notified about new jobs matching your criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500">
                <p>
                  {session?.user?.subscriptionStatus === "PRO" 
                    ? "Manage your customized job alerts" 
                    : "Upgrade to PRO to create custom job alerts"}
                </p>
                <div className="mt-2">
                  {session?.user?.subscriptionStatus === "PRO" ? (
                    <Link href="/alerts">
                      <Button variant="link" className="text-blue-500 hover:text-blue-600 p-0">
                        Manage Alerts
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant="link" 
                      className="text-blue-500 hover:text-blue-600 p-0"
                      onClick={handleSubscribe}
                    >
                      Upgrade to PRO
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
              <CardDescription>Set preferences to improve job matching</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-sm">Desired Role: Not set</p>
                  <p className="text-sm">Location: Not set</p>
                  <p className="text-sm">Experience Level: Not set</p>
                </div>
                <Button variant="link" className="text-blue-500 hover:text-blue-600 p-0">
                  Edit Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

// Main page component with Suspense boundary for useSearchParams
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}