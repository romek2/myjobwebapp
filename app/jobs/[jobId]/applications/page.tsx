'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  Eye,
  Search
} from 'lucide-react';

interface Application {
  id: string;
  user_id: string;
  job_id: number;
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
  user: {
    name: string;
    email: string;
  };
}

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  posted_at: string;
}

// SEPARATE COMPONENT FOR APPLICATION CARD
function ApplicationCard({ application, jobId, onViewDetails }: { 
  application: Application; 
  jobId: string;
  onViewDetails: () => void;
}) {
 

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'applied': 'bg-blue-100 text-blue-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'interview': 'bg-purple-100 text-purple-800',
      'offer': 'bg-green-100 text-green-800',
      'hired': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onViewDetails}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Name and Status */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">{application.user.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(application.status)}`}>
              
              {application.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Contact Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
            {/* Email */}
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              <span>{application.user.email}</span>
            </div>
            
            {/* Phone (conditional) */}
            {application.phone ? (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>{application.phone}</span>
              </div>
            ) : null}
            
            {/* Applied Date */}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
            </div>
            
            {/* Salary (conditional) */}
            {application.desired_salary ? (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>${application.desired_salary.toLocaleString()}</span>
              </div>
            ) : null}
            
           
            
           
          </div>

          {/* Cover Letter Preview (conditional) */}
          {application.cover_letter ? (
            <p className="text-sm text-gray-700 line-clamp-2">
              {application.cover_letter}
            </p>
          ) : null}
        </div>

        {/* View Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          <span>View Details</span>
        </Button>
      </div>
    </div>
  );
}

// SEPARATE COMPONENT FOR EMPTY STATE
function EmptyApplicationsState({ searchTerm, statusFilter }: { searchTerm: string; statusFilter: string }) {
  const hasFilters = searchTerm !== '' || statusFilter !== 'all';
  
  return (
    <div className="text-center py-12">
      <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium mb-2">No applications found</h3>
      <p className="text-gray-600">
        {hasFilters ? 'No applications match your filters.' : 'No one has applied to this job yet.'}
      </p>
    </div>
  );
}

// MAIN PAGE COMPONENT
export default function JobApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const jobId = params?.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/jobs/' + jobId + '/applications');
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status, jobId, router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${jobId}/applications`);
      
      if (!response.ok) {
        throw new Error('Failed to load applications');
      }

      const data = await response.json();
      setJob(data.job);
      setApplications(data.applications || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (applicationId: string) => {
    router.push(`/jobs/${jobId}/applications/${applicationId}`);
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' ||
      app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate status counts
  const statusCounts = {
    all: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
    hired: applications.filter(a => a.status === 'hired').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  // Render loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Render main content
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/admin/jobs/create')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{job?.title}</h1>
          <p className="text-gray-600">{job?.company} • {job?.location}</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('applied')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.applied}</div>
            <div className="text-sm text-gray-600">New</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('under_review')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.under_review}</div>
            <div className="text-sm text-gray-600">Review</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('interview')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.interview}</div>
            <div className="text-sm text-gray-600">Interview</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('offer')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.offer}</div>
            <div className="text-sm text-gray-600">Offer</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('hired')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-700">{statusCounts.hired}</div>
            <div className="text-sm text-gray-600">Hired</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Applications ({filteredApplications.length})
            {statusFilter !== 'all' && ` - ${statusFilter.replace('_', ' ')}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 && (
            <EmptyApplicationsState searchTerm={searchTerm} statusFilter={statusFilter} />
          )}
          
          {filteredApplications.length > 0 && (
            <div className="space-y-4">
              {filteredApplications.map((application) => {
                return (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    jobId={jobId}
                    onViewDetails={() => handleViewDetails(application.id)}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}