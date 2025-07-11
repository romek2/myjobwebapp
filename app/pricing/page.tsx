// app/pricing/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (status !== "authenticated") {
      // Redirect to sign in if not logged in
      router.push("/api/auth/signin?callbackUrl=/pricing");
      return;
    }

    try {
      setIsLoading(true);
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
        console.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlock advanced features to supercharge your job search and application process.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Free</h2>
            <div className="mb-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-gray-600 mb-8">
              Basic job search functionality for everyone.
            </p>
            <button 
              className="w-full py-3 px-4 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => router.push("/api/auth/signin")}
              disabled={status === "authenticated"}
            >
              {status === "authenticated" ? "Current Plan" : "Sign Up"}
            </button>
          </div>
          <div className="bg-gray-50 px-8 py-6">
            <h3 className="text-lg font-medium mb-4">What's included:</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Basic job search</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Access to all public jobs</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Applications Tracker</span>
              </li>
            </ul>
          </div>
        </div>

        {/* PRO Plan */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-blue-500 relative">
          <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-bold uppercase rounded-bl-lg">
            Recommended
          </div>
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">PRO</h2>
            <div className="mb-4">
              <span className="text-4xl font-bold">$4.99</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-gray-600 mb-8">
              Advanced features to maximize your job search success.
            </p>
            <button 
              className="w-full py-3 px-4 bg-blue-600 rounded-md font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Upgrade to PRO"}
            </button>
          </div>
          <div className="bg-blue-50 px-8 py-6">
            <h3 className="text-lg font-medium mb-4">Everything in Free, plus:</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Resume analysis</strong> to optimize for ATS</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Customize job alerts</strong> to get notified right away</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Live Chat</strong> with professional recruiters</span>
              </li>
             
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Early Access</strong> to premium job posts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}