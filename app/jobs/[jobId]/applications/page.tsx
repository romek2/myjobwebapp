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

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' ||
      app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
    hired: applications.filter(a => a.status === 'hired').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  // Error state
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

  // Main content
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/jobs/create')}
        >
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

      {/* Stats Cards */}
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
      
    </div>
  );
}