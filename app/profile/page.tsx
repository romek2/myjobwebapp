// app/profile/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { RefreshCw } from 'lucide-react';

// Component imports
import ProfileHeader from '@/components/profile/ProfileHeader';
import SkillsProfile from '@/components/profile/SkillsProfile';
import ResumeUpload from '@/components/profile/ResumeUpload';
import ApplicationTracker from '@/components/profile/ApplicationTracker';
import SubscriptionManagement from '@/components/profile/SubscriptionManagement';
import JobAlerts from '@/components/profile/JobAlerts';
import QuickStats from '@/components/profile/QuickStats';

// Types
interface Skill {
  id: string;
  name: string;
  category: 'programming' | 'framework' | 'tool' | 'soft' | 'other';
}

interface UserProfile {
  skills: Skill[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  preferredLocation: 'remote' | 'hybrid' | 'onsite' | 'no-preference';
  salaryMin?: number;
  salaryMax?: number;
  jobTypes: string[];
}

interface JobAlert {
  id: string;
  name: string;
  keywords: string;
  frequency: 'daily' | 'weekly' | 'instant';
  active: boolean;
  created: string;
  lastMatch?: string;
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedDate: string;
  location: string;
}

function ProfileContent() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/')
    }
  });

  const searchParams = useSearchParams();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  
  // Skills Profile State
  const [profile, setProfile] = useState<UserProfile>({
    skills: [],
    experienceLevel: 'mid',
    preferredLocation: 'remote',
    jobTypes: ['Full-time'],
  });
  
  // Get checkout status from URL parameters
  const checkoutStatus = searchParams.get("checkout");
  
  // Check if user is PRO
  const isPro = session?.user?.subscriptionStatus === "PRO";

  // Mock data for job applications
  const [applications] = useState<Application[]>([
    {
      id: '1',
      jobTitle: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      status: 'Applied',
      appliedDate: '2025-03-15',
      location: 'Remote',
    },
    {
      id: '2',
      jobTitle: 'Full Stack Engineer',
      company: 'WebSolutions LLC',
      status: 'Interview',
      appliedDate: '2025-03-10',
      location: 'New York, NY',
    },
    {
      id: '3',
      jobTitle: 'React Developer',
      company: 'AppWorks',
      status: 'Rejected',
      appliedDate: '2025-03-05',
      location: 'San Francisco, CA',
    }
  ]);

  // Mock job alerts data
  const [jobAlerts, setJobAlerts] = useState<JobAlert[]>([
    {
      id: '1',
      name: 'Senior React Developer',
      keywords: 'React, TypeScript, Remote',
      frequency: 'daily',
      active: true,
      created: '2025-03-01',
      lastMatch: '2025-03-15',
    },
    {
      id: '2',
      name: 'Frontend Engineering Roles',
      keywords: 'Frontend, JavaScript, Vue',
      frequency: 'weekly',
      active: false,
      created: '2025-02-15',
    }
  ]);

  // Handler functions
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
        window.location.href = data.url;
      } else {
        console.error("Failed to create portal session:", data.error);
        alert(`Unable to open subscription management: ${data.error || "No URL returned"}`);
      }
    } catch (error: any) {
      console.error("Error managing subscription:", error);
      alert(`Something went wrong: ${error.message || "Unknown error"}`);
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const toggleJobAlert = (alertId: string) => {
    setJobAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, active: !alert.active } : alert
      )
    );
  };

  const deleteJobAlert = (alertId: string) => {
    setJobAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Profile Header */}
        <ProfileHeader 
          session={session}
          checkoutStatus={checkoutStatus}
          isPro={isPro}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Skills Profile Builder */}
            <SkillsProfile
              profile={profile}
              setProfile={setProfile}
              isPro={isPro}
              onSubscribe={handleSubscribe}
            />

            {/* Resume Upload */}
            <ResumeUpload
              isPro={isPro}
              onSubscribe={handleSubscribe}
              isSubscribing={isSubscribing}
            />

            {/* Application Tracker */}
            <ApplicationTracker
              applications={applications}
            />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Subscription Management */}
            <SubscriptionManagement
              isPro={isPro}
              isSubscribing={isSubscribing}
              isManagingSubscription={isManagingSubscription}
              onSubscribe={handleSubscribe}
              onManageSubscription={handleManageSubscription}
            />

            {/* Job Alerts */}
            <JobAlerts
              isPro={isPro}
              jobAlerts={jobAlerts}
              onToggleAlert={toggleJobAlert}
              onDeleteAlert={deleteJobAlert}
              onSubscribe={handleSubscribe}
            />

            {/* Quick Stats */}
            <QuickStats
              applications={applications}
              skillsCount={profile.skills.length}
              jobAlerts={jobAlerts}
              isPro={isPro}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

// Main page component with Suspense boundary for useSearchParams
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}