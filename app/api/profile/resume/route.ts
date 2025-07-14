import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    const { data: resume, error } = await supabase
      .from('user_resumes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching resume:', error);
      return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
    }

    return NextResponse.json({ resume: resume || null });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Check if user has PRO subscription
    const { data: user } = await supabase
      .from('User')
      .select('subscriptionStatus')
      .eq('id', session.user.id)
      .single();

    if (user?.subscriptionStatus !== 'PRO') {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // File validation
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Delete existing resume
    await supabase
      .from('user_resumes')
      .delete()
      .eq('user_id', session.user.id);

    // For now, simulate analysis - you can implement real analysis later
    const mockAnalysis = {
      atsScore: Math.floor(Math.random() * 40) + 60, // 60-100
      techStack: ['React', 'TypeScript', 'Node.js', 'Python'],
      insights: ['Strong technical background', 'Good project experience']
    };

    // Convert file to buffer for text extraction (simplified)
    const buffer = await file.arrayBuffer();
    const textContent = `Resume content for ${file.name}`; // You'll want to implement real text extraction

    // Upload to Supabase Storage
    const fileName = `${session.user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: file.type
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Save resume data using your existing table structure
    const { data: resume, error } = await supabase
      .from('user_resumes')
      .insert({
        user_id: session.user.id,
        filename: fileName,
        file_size: file.size,
        file_type: file.type,
        text_content: textContent,
        ats_score: mockAnalysis.atsScore,
        tech_stack: mockAnalysis.techStack,
        insights: mockAnalysis.insights
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving resume:', error);
      return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 });
    }

    return NextResponse.json({ resume, analysis: mockAnalysis });
  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Get resume to delete from storage
    const { data: resume } = await supabase
      .from('user_resumes')
      .select('filename')
      .eq('user_id', session.user.id)
      .single();

    if (resume?.filename) {
      // Delete from storage
      await supabase.storage
        .from('resumes')
        .remove([resume.filename]);
    }

    // Delete from database
    const { error } = await supabase
      .from('user_resumes')
      .delete()
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting resume:', error);
      return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}