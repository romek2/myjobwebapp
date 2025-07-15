import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Job } from '@/types/job';

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: '',
    resumeFile: null as File | null
  });

  useEffect(() => {
    fetchJob();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`);
      if (response.ok) {
        const jobData = await response.json();
        setJob(jobData);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, resumeFile: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('jobId', params.id as string);
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('coverLetter', formData.coverLetter);
      
      if (formData.resumeFile) {
        submitData.append('resume', formData.resumeFile);
      }

      const response = await fetch('/api/jobs/apply-internal', {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        setIsSubmitted(true);
        
        // Track the application in user's profile
        await fetch('/api/jobs/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: params.id,
            jobTitle: job?.title,
            company: job?.company,
            applicationUrl: window.location.href,
            location: job?.location
          }),
        });
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <Button onClick={() => router.push('/')}>
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Application Submitted!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for applying to <strong>{job.title}</strong> at {job.company}. 
                We'll review your application and get back to you soon.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push('/profile')}>
                  View My Applications
                </Button>
                <Button variant="outline" onClick={() => router.push('/')}>
                  Browse More Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <p className="text-gray-600">{job.company}</p>
                  <p className="text-gray-500">{job.location}</p>
                  {job.salary && <p className="text-green-600 font-medium">{job.salary}</p>}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{job.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Apply for {job.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Resume Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resume *
                    </label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: PDF, DOC, DOCX (max 5MB)
                    </p>
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter
                    </label>
                    <textarea
                      name="coverLetter"
                      rows={6}
                      value={formData.coverLetter}
                      onChange={handleInputChange}
                      placeholder="Tell us why you're interested in this position..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}