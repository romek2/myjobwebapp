'use client';

import { useSession } from 'next-auth/react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  FileText, 
  Upload, 
  RefreshCw, 
  Briefcase, 
  Clock, 
  Building, 
  CheckCircle,
  Plus,
  X,
  MapPin,
  DollarSign,
  Users,
  Star,
  PauseCircle,
  PlayCircle,
  Trash2,
  Bell,
  Settings,
  TrendingUp,
  Eye
} from 'lucide-react';
import Link from 'next/link';

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

const SKILL_SUGGESTIONS = [
  { name: 'JavaScript', category: 'programming' },
  { name: 'TypeScript', category: 'programming' },
  { name: 'Python', category: 'programming' },
  { name: 'Java', category: 'programming' },
  { name: 'React', category: 'framework' },
  { name: 'Vue.js', category: 'framework' },
  { name: 'Angular', category: 'framework' },
  { name: 'Node.js', category: 'framework' },
  { name: 'AWS', category: 'tool' },
  { name: 'Docker', category: 'tool' },
  { name: 'Git', category: 'tool' },
  { name: 'MongoDB', category: 'tool' },
] as const;

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level', description: '0-2 years' },
  { value: 'mid', label: 'Mid Level', description: '3-5 years' },
  { value: 'senior', label: 'Senior', description: '5-8 years' },
  { value: 'lead', label: 'Lead/Principal', description: '8+ years' },
] as const;

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
  const [resumeData, setResumeData] = useState<any>(null);
  
  // Skills Profile State
  const [profile, setProfile] = useState<UserProfile>({
    skills: [], // Start with empty skills array instead of hardcoded ones
    experienceLevel: 'mid',
    preferredLocation: 'remote',
    jobTypes: ['Full-time'],
  });

  const [showSkillsEditor, setShowSkillsEditor] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Get checkout status from URL parameters
  const checkoutStatus = searchParams.get("checkout");
  
  // Check if user is PRO
  const isPro = session?.user?.subscriptionStatus === "PRO";

  // Mock data for job applications
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
  
  // Skills Profile Functions
  const addSkill = (skillName: string) => {
    if (!skillName.trim()) return;
    
    // Check if skill already exists (case-insensitive)
    const existingSkill = profile.skills.find(
      skill => skill.name.toLowerCase() === skillName.trim().toLowerCase()
    );
    
    if (existingSkill) {
      // Skill already exists, show a brief message or just clear input
      setNewSkill('');
      setShowSuggestions(false);
      return;
    }
    
    const skill: Skill = {
      id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Better unique ID
      name: skillName.trim(),
      category: 'other'
    };
    
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, skill]
    }));
    
    setNewSkill('');
    setShowSuggestions(false);
  };

  const removeSkill = (skillId: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== skillId)
    }));
  };

  const updateExperience = (level: UserProfile['experienceLevel']) => {
    setProfile(prev => ({ ...prev, experienceLevel: level }));
  };

  const updateLocation = (location: UserProfile['preferredLocation']) => {
    setProfile(prev => ({ ...prev, preferredLocation: location }));
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

  const deleteResume = async () => {
    try {
      // Simulate delete operation - replace with actual API call
      setResumeData(null);
      setUploadSuccess('Resume deleted successfully');
      setUploadError('');
    } catch (error) {
      console.error('Error deleting resume:', error);
      setUploadError('Failed to delete resume. Please try again.');
    }
  };

  const calculateCompleteness = () => {
    let score = 0;
    if (profile.skills.length > 0) score += 30;
    if (profile.skills.length >= 5) score += 20;
    if (profile.experienceLevel) score += 20;
    if (profile.preferredLocation) score += 15;
    if (profile.salaryMin && profile.salaryMax) score += 15;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

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
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Profile Header Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Profile Dashboard</CardTitle>
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
                  <span className="text-sm font-medium">Plan:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isPro 
                      ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {isPro ? (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        PRO
                      </span>
                    ) : (
                      "FREE"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Skills Profile Builder - FREE FEATURE */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Skills Profile
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    FREE
                  </span>
                </CardTitle>
                <CardDescription>
                  Build your professional profile and showcase your skills to employers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Skills Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Your Skills</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowSkillsEditor(!showSkillsEditor)}
                    >
                      {showSkillsEditor ? 'Done' : 'Edit Skills'}
                    </Button>
                  </div>
                  
                  {showSkillsEditor ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => {
                              setNewSkill(e.target.value);
                              setShowSuggestions(e.target.value.length > 0);
                            }}
                            placeholder="Add a skill (e.g., React, Python, AWS)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newSkill.trim()) {
                                e.preventDefault();
                                addSkill(newSkill);
                              }
                            }}
                          />
                          
                          {/* Skill Suggestions Dropdown */}
                          {showSuggestions && newSkill && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                              {SKILL_SUGGESTIONS
                                .filter(skill => 
                                  skill.name.toLowerCase().includes(newSkill.toLowerCase()) &&
                                  !profile.skills.some(userSkill => userSkill.name.toLowerCase() === skill.name.toLowerCase())
                                )
                                .slice(0, 5)
                                .map((skill, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      addSkill(skill.name);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    <span className="font-medium">{skill.name}</span>
                                    <span className="text-gray-500 ml-2 text-xs capitalize">
                                      {skill.category}
                                    </span>
                                  </button>
                                ))}
                              {/* Show option to add custom skill if no exact matches */}
                              {newSkill.trim() && !SKILL_SUGGESTIONS.some(skill => 
                                skill.name.toLowerCase() === newSkill.toLowerCase()
                              ) && (
                                <button
                                  onClick={() => {
                                    addSkill(newSkill);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm rounded-lg border-t"
                                >
                                  <span className="font-medium">Add "{newSkill}"</span>
                                  <span className="text-gray-500 ml-2 text-xs">Custom skill</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addSkill(newSkill)}
                          disabled={!newSkill.trim()}
                          className="btn-primary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Quick Add Popular Skills */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Popular skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {SKILL_SUGGESTIONS
                            .filter(skill => !profile.skills.some(userSkill => userSkill.name === skill.name))
                            .slice(0, 6)
                            .map((skill, index) => (
                              <button
                                key={index}
                                onClick={() => addSkill(skill.name)}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors"
                              >
                                + {skill.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <div key={skill.id} className="group relative">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
                            {skill.name}
                            <button
                              onClick={() => removeSkill(skill.id)}
                              className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                              title="Remove skill"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        </div>
                      ))}
                      {profile.skills.length === 0 && (
                        <button 
                          onClick={() => setShowSkillsEditor(true)}
                          className="px-3 py-1 border-2 border-dashed border-gray-300 text-gray-500 rounded-full text-sm hover:border-gray-400 transition-colors"
                        >
                          + Add your first skill
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Experience Level */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Experience Level
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => updateExperience(level.value)}
                        className={`p-3 text-sm border rounded-lg transition-colors text-center ${
                          profile.experienceLevel === level.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="font-medium">{level.label}</div>
                        <div className="text-xs text-gray-500">{level.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Job Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Preferred Location
                    </label>
                    <select 
                      value={profile.preferredLocation}
                      onChange={(e) => updateLocation(e.target.value as UserProfile['preferredLocation'])}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                      <option value="no-preference">No preference</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Salary Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={profile.salaryMin || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, salaryMin: parseInt(e.target.value) || undefined }))}
                        className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={profile.salaryMax || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, salaryMax: parseInt(e.target.value) || undefined }))}
                        className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Completeness */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completeness</span>
                    <span className="text-sm font-semibold text-blue-600">{completeness}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${completeness}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {completeness < 100 ? (
                      <>Complete your profile to get better job matches. </>
                    ) : (
                      "Great! Your profile is complete. "
                    )}
                    {!isPro && (
                      <button 
                        onClick={handleSubscribe}
                        className="text-blue-600 hover:underline ml-1"
                      >
                        Upgrade to PRO for AI matching
                      </button>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Resume Upload Card - PRO FEATURE */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  Resume Upload & Analysis
                  <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold rounded-full">
                    PRO
                  </span>
                </CardTitle>
                <CardDescription>
                  Upload your resume for AI-powered analysis and personalized job matching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPro ? (
                  // PRO User - Full Resume Upload Feature
                  <>
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

                    {!resumeData ? (
                      <div className="space-y-4">
                        {/* Upload Area */}
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={handleFileUpload}
                        >
                          <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="font-medium mb-1 text-sm sm:text-base">Upload your resume</p>
                          <p className="text-xs sm:text-sm text-gray-500 mb-2">Drag and drop or click to browse</p>
                          <p className="text-xs text-gray-400">Supports PDF, DOC, DOCX, TXT (max 5MB)</p>
                        </div>
                        
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          className="hidden" 
                          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" 
                        />

                        {isUploading && (
                          <div className="text-center py-4">
                            <RefreshCw className="h-5 w-5 mx-auto animate-spin text-blue-500 mb-2" />
                            <p className="text-sm text-gray-600">Uploading and analyzing...</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Resume Analysis Results */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                            <div className="flex items-start gap-3">
                              <FileText className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium break-words text-sm sm:text-base">{resumeData.filename}</p>
                                <p className="text-xs text-gray-500">
                                  Uploaded on {new Date(resumeData.uploadedAt || resumeData.updated_at).toLocaleDateString()}
                                </p>
                                
                                {/* Analysis Results */}
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                  <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="text-xs text-green-600 font-medium">ATS Score</p>
                                    <p className="text-lg font-bold text-green-700">{resumeData.atsScore || resumeData.ats_score || 0}%</p>
                                  </div>
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-xs text-blue-600 font-medium">Skills Detected</p>
                                    <p className="text-lg font-bold text-blue-700">
                                      {resumeData.techStack?.length || resumeData.tech_stack?.length || 0}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Skills */}
                                {(resumeData.techStack || resumeData.tech_stack) && (
                                  <div className="mt-3">
                                    <p className="text-xs text-gray-600 font-medium mb-2">Detected Skills:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {(resumeData.techStack || resumeData.tech_stack).slice(0, 10).map((skill: string, index: number) => (
                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                          {skill}
                                        </span>
                                      ))}
                                      {(resumeData.techStack || resumeData.tech_stack).length > 10 && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                          +{(resumeData.techStack || resumeData.tech_stack).length - 10} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 self-end sm:self-auto">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleFileUpload}
                                className="text-xs sm:text-sm"
                              >
                                Replace
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={deleteResume}
                                className="text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Upload new resume input */}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          className="hidden" 
                          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" 
                        />
                      </div>
                    )}
                  </>
                ) : (
                  // Free User - PRO Upgrade Prompt
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-purple-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Unlock AI-Powered Resume Analysis
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                        Upload your resume to get instant ATS scoring, skill extraction, and personalized job matching.
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 max-w-md mx-auto">
                      <ul className="text-sm text-gray-700 space-y-2 text-left">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>ATS compatibility scoring</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>Automatic skill extraction</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>Personalized job recommendations</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>Resume optimization suggestions</span>
                        </li>
                      </ul>
                    </div>
                    
                    <Button 
                      onClick={handleSubscribe}
                      disabled={isSubscribing}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium px-6 py-2"
                    >
                      {isSubscribing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Star className="mr-2 h-4 w-4" />
                          Upgrade to PRO
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Tracker Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Recent Applications
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {applications.length}
                  </span>
                </CardTitle>
                <CardDescription>
                  Track your job applications and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="space-y-4">
                    {/* Application Cards */}
                    <div className="space-y-3">
                      {applications.slice(0, 3).map((app) => (
                        <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 break-words text-sm sm:text-base">{app.jobTitle}</h4>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <Building className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="break-words">{app.company}</span>
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {app.location}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(app.appliedDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                              app.status === 'Applied' ? 'bg-blue-100 text-blue-800' : 
                              app.status === 'Interview' ? 'bg-green-100 text-green-800' : 
                              app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center pt-2">
                      <Button 
                        variant="outline"
                        onClick={() => router.push("/applications")}
                        className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                      >
                        View All Applications
                      </Button>
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
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Browse Jobs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Subscription Management Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPro ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">PRO Plan Active</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      You have access to all premium features including AI matching and resume analysis.
                    </p>
                    <Button
                      onClick={handleManageSubscription}
                      disabled={isManagingSubscription}
                      variant="outline"
                      className="w-full"
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
                    <div>
                      <h3 className="font-medium mb-2">Upgrade to PRO</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Unlock premium features to supercharge your job search.
                      </p>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>AI-powered job matching</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>Resume ATS analysis</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>Custom job alerts</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>Priority support</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <Button
                        onClick={handleSubscribe}
                        disabled={isSubscribing}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium"
                      >
                        {isSubscribing ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Star className="mr-2 h-4 w-4" />
                            Upgrade to PRO
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => router.push("/pricing")}
                        variant="outline"
                        className="w-full"
                      >
                        View Plans
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Alerts Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Job Alerts
                  {isPro && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      PRO
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Get notified about jobs matching your criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isPro ? (
                  <div className="space-y-4">
                    {jobAlerts.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          {jobAlerts.map((alert) => (
                            <div key={alert.id} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm break-words">{alert.name}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{alert.keywords}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-gray-400 capitalize">{alert.frequency}</span>
                                    {alert.lastMatch && (
                                      <span className="text-xs text-green-600">
                                        Last match: {new Date(alert.lastMatch).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => toggleJobAlert(alert.id)}
                                    className={`p-1 rounded ${
                                      alert.active ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                    title={alert.active ? 'Pause alert' : 'Resume alert'}
                                  >
                                    {alert.active ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                  </button>
                                  <button
                                    onClick={() => deleteJobAlert(alert.id)}
                                    className="p-1 text-red-400 hover:text-red-600 rounded"
                                    title="Delete alert"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Button 
                            onClick={() => router.push("/alerts")}
                            variant="outline" 
                            className="w-full text-sm"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Alert
                          </Button>
                          <Button 
                            onClick={() => router.push("/alerts")}
                            variant="link" 
                            className="w-full text-blue-600 hover:text-blue-700 text-sm h-auto p-0"
                          >
                            Manage All Alerts →
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 space-y-3">
                        <Bell className="h-8 w-8 mx-auto text-gray-400" />
                        <div>
                          <h4 className="font-medium text-sm">No alerts set up</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Create alerts to get notified about relevant job opportunities
                          </p>
                        </div>
                        <Button 
                          onClick={() => router.push("/alerts")}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Create First Alert
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Bell className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Job Alerts</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Upgrade to PRO to create custom job alerts and never miss an opportunity
                      </p>
                    </div>
                    <Button 
                      onClick={handleSubscribe}
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs"
                    >
                      Upgrade to PRO
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Profile Views</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">12</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Applications</span>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{applications.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Skills Listed</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">{profile.skills.length}</span>
                    </div>
                  </div>
                  {isPro && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Alerts</span>
                      <div className="flex items-center gap-1">
                        <Bell className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{jobAlerts.filter(alert => alert.active).length}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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