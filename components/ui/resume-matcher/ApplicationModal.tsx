// components/ui/resume-matcher/ApplicationModal.tsx - Cool Modern Version
'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Job } from '@/types/job';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  X, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Send, 
  User, 
  Phone, 
  DollarSign, 
  Calendar, 
  Link, 
  FileText,
  Building,
  MapPin,
  Sparkles,
  Zap
} from 'lucide-react';

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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/10 w-full max-w-md overflow-hidden animate-scale-in">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-white animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Application Sent! 🎉</h3>
            <p className="text-green-100">Your application is on its way</p>
          </div>

          <div className="p-6 text-center">
            <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-2xl p-4 mb-4">
              <h4 className="font-bold text-gray-900 mb-2">{job.title}</h4>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Building className="h-4 w-4 mr-1 text-blue-500" />
                  {job.company}
                </span>
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-green-500" />
                  {job.location}
                </span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                You'll hear back within 2-3 business days
              </p>
              <p className="flex items-center justify-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Check your email for updates
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/10 w-full max-w-4xl my-4 animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-4 sm:p-6 text-white">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/10 rounded-full"></div>
          </div>

          <div className="relative flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-3">
                <Send className="w-4 h-4 mr-2" />
                Quick Apply
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 break-words">{job.title}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-blue-100 text-sm">
                <span className="flex items-center mb-1 sm:mb-0">
                  <Building className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="break-words">{job.company}</span>
                </span>
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="break-words">{job.location}</span>
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-300 hover:scale-110 ml-2 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50/50 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Letter */}
              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-3 gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                  Cover Letter *
                </label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                  rows={5}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/60 backdrop-blur-sm transition-all duration-300 resize-none"
                  placeholder="Tell us why you're the perfect fit for this role. Highlight your relevant experience and enthusiasm..."
                  required
                />
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Tip: Mention specific skills from the job description
                </div>
              </div>

              {/* Contact Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3 gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Phone className="h-3 w-3 text-white" />
                    </div>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/60 backdrop-blur-sm transition-all duration-300"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3 gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-3 w-3 text-white" />
                    </div>
                    Desired Salary
                  </label>
                  <input
                    type="number"
                    value={formData.desiredSalary}
                    onChange={(e) => setFormData({...formData, desiredSalary: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white/60 backdrop-blur-sm transition-all duration-300"
                    placeholder="80000"
                  />
                </div>
              </div>

              {/* Additional Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3 gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-white" />
                    </div>
                    Available Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.availableStartDate}
                    onChange={(e) => setFormData({...formData, availableStartDate: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/60 backdrop-blur-sm transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3 gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <Link className="h-3 w-3 text-white" />
                    </div>
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/60 backdrop-blur-sm transition-all duration-300"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-3 gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  Portfolio/Website URL
                </label>
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({...formData, portfolioUrl: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white/60 backdrop-blur-sm transition-all duration-300"
                  placeholder="https://yourportfolio.com"
                />
              </div>

              {/* Enhanced Resume Upload */}
              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-3 gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                    <Upload className="h-3 w-3 text-white" />
                  </div>
                  Resume Upload (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-blue-50 hover:border-blue-400 transition-all duration-300">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFormData({...formData, resume: e.target.files?.[0] || null})}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">
                        {formData.resume ? formData.resume.name : 'Click to upload your resume'}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {formData.resume ? 'File selected successfully!' : 'Drag and drop or click to browse'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        <FileText className="h-3 w-3" />
                        Supports PDF, DOC, DOCX (max 5MB)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Enhanced Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/70 hover:bg-white/90 border-gray-200 hover:shadow-md transition-all duration-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting Application...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Submit Application
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Pro Tips */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
              <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Application Tips
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Mention specific technologies and experience from the job description
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  Keep your cover letter concise but impactful (2-3 paragraphs)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                  Double-check your contact information for accuracy
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    
  );
}