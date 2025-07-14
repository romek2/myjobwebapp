import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { parseResume } from '@/lib/parsers/resume-parser';
import { extractTechStack } from '@/lib/constants/tech-keywords';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check PRO access
    if (session.user.subscriptionStatus !== 'PRO') {
      return NextResponse.json({ 
        error: 'PRO subscription required for resume upload' 
      }, { status: 403 });
    }

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Parse the resume
    const resumeData = await parseResume(file);
    
    // Calculate ATS score
    const atsScore = calculateATSScore(resumeData.text);
    
    // Extract additional insights
    const insights = generateResumeInsights(resumeData);

    // Save to database
    const supabase = createServerSupabase();
    
    // Check if user already has a resume, if so, update it
    const { data: existingResume } = await supabase
      .from('user_resumes')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    const resumeRecord = {
      user_id: session.user.id,
      filename: file.name,
      file_size: file.size,
      file_type: file.type,
      text_content: resumeData.text,
      tech_stack: resumeData.techStack,
      ats_score: atsScore,
      insights: insights,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingResume) {
      // Update existing resume
      const { data, error } = await supabase
        .from('user_resumes')
        .update(resumeRecord)
        .eq('id', existingResume.id)
        .select()
        .single();
      result = { data, error };
    } else {
      // Create new resume record
      const { data, error } = await supabase
        .from('user_resumes')
        .insert({
          ...resumeRecord,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      result = { data, error };
    }

    if (result.error) {
      console.error('Database error:', result.error);
      return NextResponse.json({ 
        error: 'Failed to save resume data' 
      }, { status: 500 });
    }

    // Return success response with analysis
    return NextResponse.json({
      success: true,
      data: {
        id: result.data.id,
        filename: file.name,
        atsScore,
        techStack: resumeData.techStack,
        insights,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to process resume' 
    }, { status: 500 });
  }
}

// Helper function to calculate ATS score
function calculateATSScore(text: string): number {
  let score = 0;
  const maxScore = 100;

  // Basic checks for ATS compatibility
  const checks = {
    hasContactInfo: /(?:email|phone|linkedin)/i.test(text),
    hasExperience: /(?:experience|work|job|position|role)/i.test(text),
    hasSkills: /(?:skills|technologies|proficient|languages)/i.test(text),
    hasEducation: /(?:education|university|college|degree|bachelor|master)/i.test(text),
    goodLength: text.length > 500 && text.length < 5000,
    hasKeywords: extractTechStack(text).length > 0,
    hasMetrics: /\d+(?:%|percent|years?|months?|\+|\$|k\b)/i.test(text),
    hasActionWords: /(?:developed|created|implemented|managed|led|built|designed)/i.test(text)
  };

  // Calculate score based on checks
  const weights = {
    hasContactInfo: 15,
    hasExperience: 20,
    hasSkills: 20,
    hasEducation: 10,
    goodLength: 10,
    hasKeywords: 15,
    hasMetrics: 5,
    hasActionWords: 5
  };

  for (const [check, weight] of Object.entries(weights)) {
    if (checks[check as keyof typeof checks]) {
      score += weight;
    }
  }

  return Math.min(score, maxScore);
}

// Helper function to generate insights
function generateResumeInsights(resumeData: { text: string; techStack: string[] }) {
  const insights = [];
  const text = resumeData.text.toLowerCase();

  // Check for common issues
  if (resumeData.techStack.length < 3) {
    insights.push({
      type: 'improvement',
      message: 'Consider adding more technical skills to increase your visibility to recruiters.',
      category: 'skills'
    });
  }

  if (!/\d+(?:%|percent|years?|months?|\+|\$|k\b)/.test(text)) {
    insights.push({
      type: 'improvement',
      message: 'Add quantifiable achievements (percentages, dollar amounts, time saved) to make your impact more concrete.',
      category: 'metrics'
    });
  }

  if (text.length < 800) {
    insights.push({
      type: 'warning',
      message: 'Your resume might be too short. Consider adding more details about your experience and projects.',
      category: 'length'
    });
  }

  if (text.length > 3000) {
    insights.push({
      type: 'warning',
      message: 'Your resume might be too long. Consider condensing to the most relevant information.',
      category: 'length'
    });
  }

  // Positive feedback
  if (resumeData.techStack.length >= 5) {
    insights.push({
      type: 'success',
      message: 'Great! You have a strong technical skill set that will be attractive to employers.',
      category: 'skills'
    });
  }

  return insights;
}