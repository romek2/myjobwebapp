// components/ui/resume-matcher/ApplicationModal.tsx
'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Job } from '@/types/job';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface ApplicationModalProps {
  job: Job;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplicationModal({ job, onClose, onSuccess }: ApplicationModalProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    coverLetter: '',
    phone: '',
    desiredSalary: '',
    availableStartDate: '',
    linkedinUrl: '',
    portfolioUrl: '',
    resume: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      setError('Please sign in to apply');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append('coverLetter', formData.coverLetter);
      submitData.append('phone', formData.phone);
      submitData.append('desiredSalary', formData.desiredSalary);
      submitData.append('availableStartDate', formData.availableStartDate);
      submitData.append('linkedinUrl', formData.linkedinUrl);
      submitData.append('portfolioUrl', formData.portfolioUrl);
      
      if (formData.resume) {
        submitData.append('resume', formData.resume);
      }

      const response = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Application Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Your application for {job.title} at {job.company} has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500">
              You'll be notified of any updates via email.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Apply to {job.title}</CardTitle>
              <p className="text-gray-600">{job.company} • {job.location}</p>
            </div>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Letter *
              </label>
              <textarea
                value={formData.coverLetter}
                onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us why you're interested in this position..."
                required
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desired Salary
                </label>
                <input
                  type="number"
                  value={formData.desiredSalary}
                  onChange={(e) => setFormData({...formData, desiredSalary: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="80000"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Start Date
                </label>
                <input
                  type="date"
                  value={formData.availableStartDate}
                  onChange={(e) => setFormData({...formData, availableStartDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portfolio/Website URL
              </label>
              <input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({...formData, portfolioUrl: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourportfolio.com"
              />
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resume (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData({...formData, resume: e.target.files?.[0] || null})}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.resume ? formData.resume.name : 'Click to upload resume'}
                    </p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX (max 5MB)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}