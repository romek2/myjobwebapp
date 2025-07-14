// app/profile/page.tsx - Final version for your Supabase schema
'use client';

import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';

// Your updated hooks
import { useProfile } from '@/hooks/useProfile';
import { useSkills } from '@/hooks/useSkills';
import { useResume } from '@/hooks/useResume';
import { useJobAlerts } from '@/hooks/useJobAlerts';

// Component imports (same as before)
import ProfileHeader from '@/components/profile/ProfileHeader';
import SkillsProfile from '@/components/profile/SkillsProfile';
import ResumeUpload from '@/components/profile/ResumeUpload';
import ApplicationTracker from '@/components/profile/ApplicationTracker';
import SubscriptionManagement from '@/components/profile/SubscriptionManagement';
import JobAlerts from '@/components/profile/JobAlerts';
import QuickStats from '@/components/profile/QuickStats';
import { UserProfile, Skill, Resume, JobAlert } from '@/types';

function ProfileContent() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/')
    }
  });

  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");

  // Use your updated hooks
  const {
    profile,
    setProfile,
    resume,
    jobAlerts,
    setJobAlerts,
    subscriptionStatus,
    isPro,
    isLoading: profileLoading,
    updateProfile
  } = useProfile();

  const { addSkill, removeSkill } = useSkills();
  const { uploadResume, deleteResume, isUploading } = useResume();
  const { toggleAlert, deleteAlert } = useJobAlerts();

  // Mock applications data (you can add a job_applications API later)
  const applications = [
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
    }
  ];

  // Enhanced skill management
  const handleAddSkill = async (skillName: string, category: string = 'other') => {
    try {
      const newSkill = await addSkill(skillName, category);
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
      return newSkill;
    } catch (error) {
      console.error('Failed to add skill:', error);
      throw error;
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    try {
      await removeSkill(skillId);
      setProfile(prev => ({
        ...prev,
        skills: prev.skills.filter(skill => skill.id !== skillId)
      }));
    } catch (error) {
      console.error('Failed to remove skill:', error);
      throw error;
    }
  };

  // Subscription handlers
  const handleSubscribe = async () => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error managing subscription:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  // Job alert handlers
  const handleToggleJobAlert = async (alertId: string) => {
    try {
      await toggleAlert(alertId);
      setJobAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, active: !alert.active } : alert
        )
      );
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  };

  const handleDeleteJobAlert = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
      setJobAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  if (status === "loading" || profileLoading) {
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
            
            {/* Skills Profile with Real Data */}
            <SkillsProfile
              profile={profile}
              setProfile={setProfile}
              isPro={isPro}
              onSubscribe={handleSubscribe}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
              onUpdateProfile={updateProfile}
            />

            {/* Resume Upload with Existing user_resumes Table */}
            <ResumeUpload
              isPro={isPro}
              onSubscribe={handleSubscribe}
              isSubscribing={false}
              resume={resume}
              onUpload={uploadResume}
              onDelete={deleteResume}
              isUploading={isUploading}
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
              isSubscribing={false}
              isManagingSubscription={false}
              onSubscribe={handleSubscribe}
              onManageSubscription={handleManageSubscription}
            />

            {/* Job Alerts with Real Data */}
            <JobAlerts
              isPro={isPro}
              jobAlerts={jobAlerts}
              onToggleAlert={handleToggleJobAlert}
              onDeleteAlert={handleDeleteJobAlert}
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

// Main page component with Suspense boundary
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