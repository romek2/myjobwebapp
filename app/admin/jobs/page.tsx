// app/admin/jobs/page.tsx - Complete Job management dashboard
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Building, 
  MapPin, 
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { useProAccess } from '@/lib/subscription';

// Types
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  posted_at: string;
  salary?: string;
  application_type?: 'direct' | 'external' | 'both';
  employer_email?: string;
  application_deadline?: string;
  job_type?: string;
  experience_level?: string;
  benefits?: string[];
  active?: boolean;
  created_at: string;
}

interface CreateJobFormData {
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  job_type: string;
  experience_level: string;
  application_deadline: string;
  employer_email: string;
  benefits: string;
  application_type: 'direct' | 'external' | 'both';
}

// Main Component
export default function AdminJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isPro = useProAccess();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'external'>('all');

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/admin/jobs');
      return;
    }

    if (status === 'authenticated' && !isPro) {
      router.push('/pricing');
      return;
    }

    if (status === 'authenticated' && isPro) {
      loadJobs();
    }
  }, [status, isPro, router]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/jobs');
      if (!response.ok) {
        throw new Error('Failed to load jobs');
      }
      
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs';
      setError(errorMessage);
      console.error('Error loading jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async (formData: CreateJobFormData) => {
    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          benefits: formData.benefits.split(',').map(b => b.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create job');
      }

      const data = await response.json();
      setJobs(prev => [data.job, ...prev]);
      setShowCreateForm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job';
      setError(errorMessage);
    }
  };

  const handleEditJob = async (jobId: string, formData: CreateJobFormData) => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          benefits: formData.benefits.split(',').map(b => b.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update job');
      }

      const data = await response.json();
      setJobs(prev => prev.map(job => job.id === jobId ? data.job : job));
      setEditingJob(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job';
      setError(errorMessage);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete job');
      }

      setJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job';
      setError(errorMessage);
    }
  };

  const handleToggleActive = async (jobId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle job status');
      }

      const data = await response.json();
      setJobs(prev => prev.map(job => job.id === jobId ? { ...job, active: data.active } : job));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle job status';
      setError(errorMessage);
    }
  };

  // Filter and search jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || job.application_type === filterType;

    return matchesSearch && matchesFilter;
  });

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

  // Unauthorized state
  if (!session || !isPro) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6 text-gray-600">You need PRO access to manage jobs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Job Management</h1>
          <p className="text-gray-600">Create and manage internal job postings</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Job
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'direct' | 'external')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="direct">Direct Apply</option>
                <option value="external">External Apply</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={loadJobs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs ({filteredJobs.length})</CardTitle>
          <CardDescription>
            Manage your internal job postings and external job listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'No jobs match your search criteria.' 
                  : 'Create your first job posting to get started.'}
              </p>
              {(!searchTerm && filterType === 'all') && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Job
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={() => setEditingJob(job)}
                  onDelete={() => handleDeleteJob(job.id)}
                  onToggleActive={() => handleToggleActive(job.id, job.active || false)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Job Modal */}
      {showCreateForm && (
        <JobFormModal
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateJob}
          title="Create New Job"
        />
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <JobFormModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSubmit={(formData) => handleEditJob(editingJob.id, formData)}
          title="Edit Job"
        />
      )}
    </div>
  );
}

// Job Card Component
interface JobCardProps {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function JobCard({ job, onEdit, onDelete, onToggleActive }: JobCardProps) {
  const isActive = job.active !== false; // Default to true if not specified

  return (
    <div className={`border rounded-lg p-4 ${isActive ? 'bg-white' : 'bg-gray-50 opacity-75'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">{job.title}</h3>
            <div className="flex items-center gap-2">
              {job.application_type === 'direct' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  Direct Apply
                </span>
              )}
              {job.application_type === 'external' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  External Apply
                </span>
              )}
              {job.application_type === 'both' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                  Both
                </span>
              )}
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              {job.company}
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {job.location}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Posted {new Date(job.posted_at).toLocaleDateString()}
            </div>
          </div>
          
          <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
          
          {job.salary && (
            <p className="text-sm font-medium text-green-600 mt-2">{job.salary}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleActive}
            title={isActive ? 'Deactivate job' : 'Activate job'}
          >
            {isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            title="Edit job"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 text-gray-500 hover:text-gray-700"
            title="View job"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
            title="Delete job"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Job Form Modal Component
interface JobFormModalProps {
  job?: Job;
  onClose: () => void;
  onSubmit: (formData: CreateJobFormData) => void;
  title: string;
}

function JobFormModal({ job, onClose, onSubmit, title }: JobFormModalProps) {
  const [formData, setFormData] = useState<CreateJobFormData>({
    title: job?.title || '',
    company: job?.company || '',
    location: job?.location || '',
    description: job?.description || '',
    salary: job?.salary || '',
    job_type: job?.job_type || 'Full-time',
    experience_level: job?.experience_level || 'Mid',
    application_deadline: job?.application_deadline ? job.application_deadline.split('T')[0] : '',
    employer_email: job?.employer_email || '',
    benefits: job?.benefits?.join(', ') || '',
    application_type: job?.application_type || 'direct',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="p-2">
            <span className="sr-only">Close</span>
            ×
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Remote, USA"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Type *
              </label>
              <select
                value={formData.application_type}
                onChange={(e) => setFormData({...formData, application_type: e.target.value as 'direct' | 'external' | 'both'})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="direct">Direct Apply (Internal)</option>
                <option value="external">External Apply Only</option>
                <option value="both">Both Direct & External</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                value={formData.job_type}
                onChange={(e) => setFormData({...formData, job_type: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level
              </label>
              <select
                value={formData.experience_level}
                onChange={(e) => setFormData({...formData, experience_level: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Entry">Entry Level</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior Level</option>
                <option value="Lead">Lead/Principal</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary Range
              </label>
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., $80,000 - $120,000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                value={formData.application_deadline}
                onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employer Email (for direct applications)
            </label>
            <input
              type="email"
              value={formData.employer_email}
              onChange={(e) => setFormData({...formData, employer_email: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="hiring@company.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={6}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed job description, requirements, and responsibilities..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benefits (comma-separated)
            </label>
            <input
              type="text"
              value={formData.benefits}
              onChange={(e) => setFormData({...formData, benefits: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Health insurance, 401k, Remote work, Flexible hours"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {job ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}