// app/company/application/[token]/page.tsx - FIXED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  MessageSquare,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface ApplicationData {
  application: {
    id: string | number;
    job_title: string;
    company: string;
    status: string;
    applied_at: string;
    cover_letter?: string;
    resume_file_url?: string;
    desired_salary?: number;
    available_start_date?: string;
    linkedin_url?: string;
    portfolio_url?: string;
    phone?: string;
    company_notes?: string;
    interview_date?: string;
    interviewer_name?: string;
    interview_location?: string;
    user: {
      name: string;
      email: string;
    };
  };
  job: {
    title: string;
    company: string;
    location: string;
  };
}

export default function CompanyApplicationPortal() {
  const params = useParams();
  const token = params?.token as string;
  
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Form state
  const [selectedStatus, setSelectedStatus] = useState('');
  const [companyNotes, setCompanyNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [location, setLocation] = useState('');

  // Load application data
  useEffect(() => {
    if (token) {
      loadApplicationData();
    } else {
      setError('No token provided in URL');
      setIsLoading(false);
    }
  }, [token]);

  const loadApplicationData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading application data for token:', token);
      
      const response = await fetch(`/api/company/application/${token}`);
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        
        if (response.status === 404) {
          throw new Error('Application not found or link has expired');
        } else if (response.status === 403) {
          throw new Error('Access denied - invalid or expired link');
        } else {
          throw new Error(`Failed to load application (${response.status})`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Received data:', data);
      
      // Validate the response structure
      if (!data || !data.application) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response from server');
      }

      // Additional validation for required fields
      if (!data.application.company) {
        console.error('❌ Missing company field in application:', data.application);
        throw new Error('Application data is incomplete');
      }
      
      setApplicationData(data);
      setSelectedStatus(data.application.status);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load application';
      console.error('💥 Error in loadApplicationData:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!applicationData || !token) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      console.log('📤 Updating status to:', selectedStatus);
      
      const response = await fetch(`/api/company/application/${token}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          companyNotes,
          interviewDate: interviewDate || null,
          interviewer: interviewer || null,
          location: location || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update application');
      }

      const result = await response.json();
      console.log('✅ Update successful:', result);
      
      // Update local state
      setApplicationData(prev => prev ? {
        ...prev,
        application: {
          ...prev.application,
          status: selectedStatus,
          company_notes: companyNotes,
          interview_date: interviewDate || prev.application.interview_date,
          interviewer_name: interviewer || prev.application.interviewer_name,
          interview_location: location || prev.application.interview_location,
        }
      } : null);
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 5000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update application';
      console.error('💥 Update error:', err);
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'under_review': return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      case 'interview': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'offer': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'hired': return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading application...</p>
            <p className="text-xs text-gray-400 mt-2">Token: {token?.substring(0, 8)}...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Access Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-4">
              Token: {token?.substring(0, 8)}...
            </p>
            <div className="space-y-2">
              <Button onClick={loadApplicationData} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <p className="text-xs text-gray-400">
                If this continues, please contact Workr support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <h2 className="text-xl font-semibold mb-2">No Application Found</h2>
            <p className="text-gray-600">Unable to load application data.</p>
            <p className="text-xs text-gray-400 mt-2">Token: {token?.substring(0, 8)}...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { application, job } = applicationData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Management</h1>
          <p className="text-gray-600">Workr Company Portal</p>
        </div>

        {/* Success Message */}
        {updateSuccess && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Application updated successfully! The candidate has been notified.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Application Details */}
          <div className="space-y-6">
            
            {/* Job & Candidate Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Position & Candidate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg">{application.job_title}</h3>
                  <p className="text-gray-600">{application.company} • {job?.location || 'Location not specified'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      {application.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{application.user.name}</p>
                      <p className="text-sm text-gray-500">Candidate</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <a href={`mailto:${application.user.email}`} className="font-medium text-blue-600 hover:underline">
                        {application.user.email}
                      </a>
                      <p className="text-sm text-gray-500">Email</p>
                    </div>
                  </div>
                  
                  {application.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{application.phone}</p>
                        <p className="text-sm text-gray-500">Phone</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{formatDate(application.applied_at)}</p>
                      <p className="text-sm text-gray-500">Applied</p>
                    </div>
                  </div>
                  
                  {application.desired_salary && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">${application.desired_salary.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Desired Salary</p>
                      </div>
                    </div>
                  )}
                  
                  {application.available_start_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{formatDate(application.available_start_date)}</p>
                        <p className="text-sm text-gray-500">Available Start</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* External Links */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {application.linkedin_url && (
                    <a 
                      href={application.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      LinkedIn
                    </a>
                  )}
                  
                  {application.portfolio_url && (
                    <a 
                      href={application.portfolio_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Portfolio
                    </a>
                  )}
                  
                  {application.resume_file_url && (
                    <a 
                      href={application.resume_file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Resume
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cover Letter */}
            {application.cover_letter && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Cover Letter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {application.cover_letter}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Status Management */}
          <div className="space-y-6">
            
            {/* Status Update Form */}
            <Card>
              <CardHeader>
                <CardTitle>Update Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="applied">Applied</option>
                    <option value="under_review">Under Review</option>
                    <option value="interview">Interview Scheduled</option>
                    <option value="offer">Offer Extended</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Not Selected</option>
                  </select>
                </div>

                {/* Interview Details */}
                {selectedStatus === 'interview' && (
                  <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800">Interview Details</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interviewer Name
                      </label>
                      <input
                        type="text"
                        value={interviewer}
                        onChange={(e) => setInterviewer(e.target.value)}
                        placeholder="e.g., Sarah Johnson, Hiring Manager"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location / Meeting Link
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Zoom link or office address"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* Company Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message to Candidate
                  </label>
                  <textarea
                    value={companyNotes}
                    onChange={(e) => setCompanyNotes(e.target.value)}
                    placeholder="Add a personal message for the candidate (optional)..."
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This message will be included in the notification email to the candidate.
                  </p>
                </div>

                {/* Update Button */}
                <Button
                  onClick={handleStatusUpdate}
                  disabled={isUpdating || selectedStatus === application.status}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update & Notify Candidate'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Application Info */}
            <Card>
              <CardHeader>
                <CardTitle>Application Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Application ID:</span>
                  <span className="font-mono">{String(application.id).slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Submitted:</span>
                  <span>{new Date(application.applied_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform:</span>
                  <span>Workr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Token:</span>
                  <span className="font-mono text-xs">{token?.substring(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Powered by <span className="font-semibold text-blue-600">Workr</span> • 
            Secure portal access expires in 7 days
          </p>
        </div>
      </div>
    </div>
  );
}