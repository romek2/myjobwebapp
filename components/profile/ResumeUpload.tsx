// components/profile/ResumeUpload.tsx - FIXED with missing props
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Star 
} from 'lucide-react';
import { Resume } from '@/types';

// ✅ FIXED: Added missing props that your main page is passing
interface ResumeUploadProps {
  isPro: boolean;
  onSubscribe: () => void;
  isSubscribing: boolean;
  resume: Resume | null;                    // ✅ Added missing prop
  onUpload: (file: File) => Promise<any>;   // ✅ Added missing prop
  onDelete: () => Promise<boolean>;         // ✅ Added missing prop
  isUploading: boolean;                     // ✅ Added missing prop
}

export default function ResumeUpload({ 
  isPro, 
  onSubscribe, 
  isSubscribing,
  resume,        // ✅ Use resume from props instead of local state
  onUpload,      // ✅ Use upload handler from props
  onDelete,      // ✅ Use delete handler from props
  isUploading    // ✅ Use loading state from props
}: ResumeUploadProps) {
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      // ✅ FIXED: Use the onUpload prop instead of simulating
      await onUpload(file);
      setUploadSuccess(`Successfully uploaded ${file.name}`);
      setUploadError('');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload resume';
      setUploadError(errorMessage);
      setUploadSuccess('');
    }
  };

  const handleDelete = async () => {
    try {
      // ✅ FIXED: Use the onDelete prop instead of local logic
      await onDelete();
      setUploadSuccess('Resume deleted successfully');
      setUploadError('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete resume';
      setUploadError(errorMessage);
    }
  };

  return (
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

            {!resume ? (
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
                        {/* ✅ FIXED: Use resume prop data with proper property names */}
                        <p className="font-medium break-words text-sm sm:text-base">{resume.filename}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded on {new Date(resume.created_at).toLocaleDateString()}
                        </p>
                        
                        {/* Analysis Results */}
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-green-600 font-medium">ATS Score</p>
                            <p className="text-lg font-bold text-green-700">{resume.ats_score || 0}%</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 font-medium">Skills Detected</p>
                            <p className="text-lg font-bold text-blue-700">
                              {resume.tech_stack?.length || 0}
                            </p>
                          </div>
                        </div>
                        
                        {/* Skills */}
                        {resume.tech_stack && resume.tech_stack.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-600 font-medium mb-2">Detected Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {resume.tech_stack.slice(0, 10).map((skill: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {resume.tech_stack.length > 10 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{resume.tech_stack.length - 10} more
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
                        disabled={isUploading}
                      >
                        Replace
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDelete}
                        className="text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isUploading}
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
              onClick={onSubscribe}
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
  );
}