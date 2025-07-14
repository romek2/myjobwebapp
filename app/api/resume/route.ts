import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const { data: resume, error } = await supabase
      .from('user_resumes')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No resume found
        return NextResponse.json({ resume: null });
      }
      return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
    }

    return NextResponse.json({ resume });
  } catch (error) {
    console.error('Get resume error:', error);
    return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
  }
}