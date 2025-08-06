// app/pricing/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckIcon, Crown, Zap, Star, Users, TrendingUp, Sparkles, ArrowRight, Shield } from "lucide-react";

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

  const features = {
    free: [
      "Basic job search",
      "Access to all public jobs", 
      "Applications Tracker"
    ],
    pro: [
      "Resume upload for quick apply",
      "Customize job alerts",
      "Live Chat with professional recruiters",
      "Early Access to premium job posts"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

      <div className="relative max-w-7xl mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full text-blue-800 text-sm font-medium mb-6">
            <Crown className="w-4 h-4 mr-2" />
            Pricing Plans
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Unlock advanced features to supercharge your job search and land your dream position faster than ever before.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { icon: Users, number: '10K+', label: 'Happy Users' },
              { icon: TrendingUp, number: '95%', label: 'Success Rate' },
              { icon: Zap, number: '24h', label: 'Avg. Response' }
            ].map(({ icon: Icon, number, label }, index) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-3">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{number}</div>
                <div className="text-gray-600 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-black/5 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <div className="p-8 sm:p-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Free</h2>
                  <p className="text-gray-600">Perfect for getting started</p>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600 text-xl">/month</span>
                </div>
                <p className="text-gray-600 mt-2">
                  Basic job search functionality for everyone.
                </p>
              </div>

              <button 
                className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 mb-8 ${
                  status === "authenticated" 
                    ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800 hover:scale-105"
                }`}
                onClick={() => status !== "authenticated" && router.push("/api/auth/signin")}
                disabled={status === "authenticated"}
              >
                {status === "authenticated" ? "Current Plan" : "Get Started Free"}
              </button>
            </div>
            
            <div className="bg-gray-50/50 backdrop-blur-sm px-8 sm:px-10 py-8">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                What's included:
              </h3>
              <ul className="space-y-4">
                {features.free.map((feature) => (
                  <li key={feature} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* PRO Plan */}
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105">
            {/* Popular badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 text-sm font-bold uppercase rounded-bl-2xl">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>Most Popular</span>
              </div>
            </div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl"></div>
            
            <div className="relative p-8 sm:p-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">PRO</h2>
                  <p className="text-gray-600">Maximize your success</p>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">$4.99</span>
                  <span className="text-gray-600 text-xl">/month</span>
                </div>
                <p className="text-gray-600 mt-2">
                  Advanced features to maximize your job search success.
                </p>
              </div>

              <button 
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-semibold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/25 hover:scale-105 mb-8"
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Crown className="w-5 h-5" />
                    <span>Upgrade to PRO</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </button>

              {/* Money back guarantee */}
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-8">
                <Shield className="w-4 h-4" />
                <span>30-day money back guarantee</span>
              </div>
            </div>
            
            <div className="relative bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm px-8 sm:px-10 py-8">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Sparkles className="w-5 h-5 text-blue-500 mr-2" />
                Everything in Free, plus:
              </h3>
              <ul className="space-y-4">
                {features.pro.map((feature) => (
                  <li key={feature} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckIcon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">
                      {feature.includes('**') ? (
                        <strong>{feature.replace(/\*\*/g, '')}</strong>
                      ) : (
                        feature
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Additional benefits */}
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-2xl border border-blue-200/50">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <Zap className="w-4 h-4 text-blue-500 mr-2" />
                  Exclusive Benefits
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Priority customer support</li>
                  <li>• Advanced analytics dashboard</li>
                  <li>• Salary negotiation guides</li>
                  <li>• Interview preparation resources</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Everything you need to know about our pricing</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Can I cancel my subscription anytime?",
                a: "Yes, you can cancel your PRO subscription at any time. You'll continue to have access to PRO features until the end of your billing period."
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 30 days for a full refund."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal through our secure Stripe payment system."
              },
              {
                q: "How do job alerts work?",
                a: "PRO subscribers can create custom job alerts based on keywords, location, salary, and other criteria. You'll receive notifications via email and in-app when matching jobs are posted."
              }
            ].map(({ q, a }, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg shadow-black/5 p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-600">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-3xl p-12 text-white relative overflow-hidden">
            {/* Background pattern */}
               <div className="absolute inset-0 opacity-30" style={{
  backgroundImage: `url("data:image/svg+xml,<svg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'><g fill='white' fill-opacity='0.05'><path d='M0 0h40v40H0V0zm20 20a20 20 0 1 1 0-40 20 20 0 0 1 0 40z'/></g></svg>")`
}}></div>
            
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to accelerate your career?
              </h2>
              
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of professionals who've found their dream jobs with our platform. 
                Start your journey today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={handleSubscribe}
                  className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Start PRO Trial
                </button>
                
                <div className="text-blue-200 text-sm">
                  Cancel anytime • No setup fees
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}