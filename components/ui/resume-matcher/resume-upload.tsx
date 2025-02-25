// src/components/resume-upload.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload } from 'lucide-react';
import { parseResume } from '@/lib/parsers/resume-parser';

interface ResumeUploadProps {
  onFileUpload: (file: File, resumeData: { text: string; techStack: string[] }) => void;
  step: number;
}

export default function ResumeUpload({ onFileUpload, step }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setProcessing(true);
      setError(null);

      try {
        const resumeData = await parseResume(uploadedFile);
        onFileUpload(uploadedFile, resumeData);
      } catch (err) {
        setError('Error processing resume. Please try again.');
        console.error('Resume processing error:', err);
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <Card className={`transition-all duration-300 ${step !== 1 && 'opacity-60'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Step 1: Upload Your Resume
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <input 
            type="file" 
            accept=".pdf,.doc,.docx,.txt" 
            onChange={handleFileUpload} 
            className="hidden" 
            id="resume-upload" 
            disabled={processing}
          />
          <label 
            htmlFor="resume-upload" 
            className="cursor-pointer text-blue-600 hover:text-blue-800"
          >
            {processing ? 'Processing...' : 'Choose a file'}
          </label>
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}