'use client';

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

// Create a client component that uses useSearchParams
function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  
  // Get checkout status from URL parameters
  const checkoutStatus = searchParams.get("checkout");

  // Debug logs and the rest of your component code...
  useEffect(() => {
    console.log("Profile component rendering, status:", status);
    console.log("Session data:", session);
    
    if (status === "loading") {
      console.log("Session loading...");
      return;
    }
    
    if (status === "unauthenticated") {
      console.log("Not authenticated, redirecting...");
      router.push("/api/auth/signin?callbackUrl=/profile");
    } else {
      console.log("Authenticated!");
      setLoading(false);
    }
  }, [status, session, router]);

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

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
      {/* Display checkout status messages */}
      {checkoutStatus === "success" && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Your subscription was successful! You now have PRO access.
        </div>
      )}
      
      {checkoutStatus === "cancel" && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Your subscription process was canceled.
        </div>
      )}
      
      {/* User info */}
      {session?.user && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center space-x-4">
            {session.user.image && (
              <img 
                src={session.user.image} 
                alt={session.user.name || "User"} 
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold">{session.user.name}</h2>
              <p className="text-gray-600">{session.user.email}</p>
              <p className="mt-2">
                <span className="font-medium">Subscription:</span>{" "}
                <span className={session.user.subscriptionStatus === "PRO" ? "text-green-600 font-semibold" : "text-gray-600"}>
                  {session.user.subscriptionStatus || "FREE"}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscription info */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Subscription Management</h2>
        
        {session?.user?.subscriptionStatus === "PRO" ? (
          <div>
            <p className="mb-4">
              You currently have a <span className="font-semibold text-green-600">PRO</span> subscription.
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={isManagingSubscription}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {isManagingSubscription ? "Loading..." : "Manage Subscription"}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4">Upgrade to PRO to unlock all features:</p>
            <ul className="list-disc ml-5 mb-4">
              <li>Resume analysis and editing</li>
              <li>Track job applications</li>
              <li>Advanced job search filters</li>
              <li>Unlimited saved jobs</li>
            </ul>
            <div className="flex space-x-4">
              <button
                onClick={handleSubscribe}
                disabled={isSubscribing}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-2 px-6 rounded-md font-medium shadow-md disabled:opacity-50"
              >
                {isSubscribing ? "Loading..." : "Upgrade to PRO"}
              </button>
              <button
                onClick={() => router.push("/pricing")}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md"
              >
                View Plans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}