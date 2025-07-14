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

    const { data: skills, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching skills:', error);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    return NextResponse.json({ skills: skills || [] });
  } catch (error) {
    console.error('Error fetching skills:', error);
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
    const { name, category } = await request.json();

    // Check if skill already exists
    const { data: existingSkill } = await supabase
      .from('user_skills')
      .select('id')
      .eq('user_id', session.user.id)
      .ilike('name', name)
      .single();

    if (existingSkill) {
      return NextResponse.json({ error: 'Skill already exists' }, { status: 409 });
    }

    const { data: skill, error } = await supabase
      .from('user_skills')
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        category: category || 'other'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating skill:', error);
      return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
    }

    return NextResponse.json({ skill });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('id');

    if (!skillId) {
      return NextResponse.json({ error: 'Skill ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', parseInt(skillId))
      .eq('user_id', session.user.id); // Ensure user owns the skill

    if (error) {
      console.error('Error deleting skill:', error);
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}