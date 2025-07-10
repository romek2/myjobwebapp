'use client';

import { useSession } from 'next-auth/react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, Upload, RefreshCw, Briefcase, Clock, Building, CheckCircle } from 'lucide-react';
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get checkout status from URL parameters
  const checkoutStatus = searchParams.get("checkout");

  // Mock data for job applications - in a real app, you would fetch this from your backend
  const [applications] = useState([
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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileType = file.type;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(fileType)) {
      setUploadError('Invalid file type. Please upload a PDF or Word document');
      setUploadSuccess('');
      return;
    }

    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File is too large. Maximum size is 5MB');
      setUploadSuccess('');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      // Simulate upload - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadSuccess(`Successfully uploaded ${file.name}`);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      setUploadError('Failed to upload resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="flex justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Header Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Checkout Status Messages */}
            {checkoutStatus === "success" && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription was successful! You now have PRO access.
                </AlertDescription>
              </Alert>
            )}
            
            {checkoutStatus === "cancel" && (
              <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription process was canceled.
                </AlertDescription>
              </Alert>
            )}

            {/* User Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="text-lg">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold break-words">
                  {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-gray-500 break-all text-sm sm:text-base">{session?.user?.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">Subscription:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    session?.user?.subscriptionStatus === "PRO" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {session?.user?.subscriptionStatus || "FREE"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Subscription Management</CardTitle>
          </CardHeader>
          <CardContent>
            {session?.user?.subscriptionStatus === "PRO" ? (
              <div className="space-y-4">
                <p className="text-sm sm:text-base">
                  You currently have a <span className="font-semibold text-green-600">PRO</span> subscription.
                </p>
                <Button
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isManagingSubscription ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Manage Subscription"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm sm:text-base">Upgrade to PRO to unlock all features:</p>
                <ul className="list-disc ml-5 space-y-1 text-sm sm:text-base">
                  <li>Resume analysis optimized for ATS</li>
                  <li>Custom job alerts</li>
                  <li>Priority support</li>
                  <li>Advanced job search filters</li>
                  <li>Early Access</li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium"
                  >
                    {isSubscribing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Upgrade to PRO"
                    )}
                  </Button>
                  <Button
                    onClick={() => router.push("/pricing")}
                    variant="outline"
                    className="w-full sm:w-auto border border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    View Plans
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resume Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Your Resumes</CardTitle>
            <CardDescription>Upload and manage your resumes (PDF or DOC files only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            
            {uploadSuccess && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{uploadSuccess}</AlertDescription>
              </Alert>
            )}

            {/* Upload Area */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={handleFileUpload}
            >
              <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium mb-1 text-sm sm:text-base">Upload your resume</p>
              <p className="text-xs sm:text-sm text-gray-500 mb-2">Drag and drop or click to browse</p>
              <p className="text-xs text-gray-400">Supports PDF, DOC, DOCX (max 5MB)</p>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
            />

            {isUploading && (
              <div className="text-center py-4">
                <RefreshCw className="h-5 w-5 mx-auto animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            )}
            
            {/* Resume List */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Uploaded Resumes</h3>
              <div className="border border-gray-200 rounded-md">
                <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-words text-sm sm:text-base">MyResume_2025.pdf</p>
                      <p className="text-xs text-gray-500">Uploaded on March 15, 2025</p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Tracker Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Briefcase className="h-5 w-5 mr-2" />
              Application Tracker
            </CardTitle>
            <CardDescription>Track your job applications and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {/* Desktop Table - Hidden on mobile */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4">
                            <div className="text-sm font-medium text-gray-900 break-words">{app.jobTitle}</div>
                            <div className="text-xs text-gray-500">{app.location}</div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                              <span className="text-sm text-gray-900 break-words">{app.company}</span>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                              app.status === 'Applied' ? 'bg-blue-100 text-blue-800' : 
                              app.status === 'Interview' ? 'bg-green-100 text-green-800' : 
                              app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                              <span className="whitespace-nowrap">{new Date(app.appliedDate).toLocaleDateString()}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards - Shown only on mobile and tablet */}
                <div className="lg:hidden space-y-3">
                  {applications.map((app) => (
                    <Card key={app.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 break-words text-sm">{app.jobTitle}</h4>
                              <p className="text-xs text-gray-500 flex items-center mt-1">
                                <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="break-words">{app.company}</span>
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                              app.status === 'Applied' ? 'bg-blue-100 text-blue-800' : 
                              app.status === 'Interview' ? 'bg-green-100 text-green-800' : 
                              app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span className="break-words">{app.location}</span>
                            <span className="flex items-center whitespace-nowrap">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(app.appliedDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  When you apply for jobs, they will appear here
                </p>
                <Button 
                  onClick={() => router.push("/")}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Browse Jobs
                </Button>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <Button 
                variant="outline"
                onClick={() => router.push("/applications")}
                className="w-full sm:w-auto text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
              >
                View All Applications
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Alerts Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Job Alerts</CardTitle>
            <CardDescription>Get notified about new jobs matching your criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm sm:text-base text-gray-600">
                {session?.user?.subscriptionStatus === "PRO" 
                  ? "Manage your customized job alerts" 
                  : "Upgrade to PRO to create custom job alerts"}
              </p>
              <div>
                {session?.user?.subscriptionStatus === "PRO" ? (
                  <Link href="/alerts">
                    <Button variant="link" className="text-blue-500 hover:text-blue-600 p-0 h-auto">
                      Manage Alerts →
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant="link" 
                    className="text-blue-500 hover:text-blue-600 p-0 h-auto"
                    onClick={handleSubscribe}
                  >
                    Upgrade to PRO →
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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