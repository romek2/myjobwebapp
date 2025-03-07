// app/api/job-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { hasProAccessServer } from '@/lib/subscription';

// Main GET handler - fetches all alerts for a user
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check PRO access
    const hasPro = await hasProAccessServer(session.user.id);
    if (!hasPro) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }
    
    // Initialize Supabase
    const supabase = createServerSupabase();
    
    // Fetch alerts
    const { data, error } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Transform data for frontend (snake_case to camelCase)
    const formattedAlerts = data.map(alert => ({
      id: alert.id,
      name: alert.name,
      keywords: alert.keywords,
      frequency: alert.frequency,
      active: alert.active,
      userId: alert.user_id,
      createdAt: alert.created_at,
      updatedAt: alert.updated_at
    }));
    
    return NextResponse.json(formattedAlerts);
  } catch (error) {
    console.error('Unexpected error in GET /api/job-alerts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST handler - creates a new alert
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check PRO access
    const hasPro = await hasProAccessServer(session.user.id);
    if (!hasPro) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { name, keywords, frequency } = body;
    
    // Validate inputs
    if (!name || !keywords || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'realtime'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency value' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase
    const supabase = createServerSupabase();
    
    // Check alert limit (max 10)
    const { count, error: countError } = await supabase
      .from('job_alerts')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id);
    
    if (countError) {
      console.error('Error counting alerts:', countError);
      return NextResponse.json(
        { error: 'Failed to check alert limit' },
        { status: 500 }
      );
    }
    
    if (count !== null && count >= 10) {
      return NextResponse.json(
        { error: 'You have reached the maximum limit of 10 job alerts' },
        { status: 400 }
      );
    }
    
    // Create new alert
    const { data, error } = await supabase
      .from('job_alerts')
      .insert({
        user_id: session.user.id,
        name,
        keywords,
        frequency,
        active: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating alert:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Format response
    const formattedAlert = {
      id: data.id,
      name: data.name,
      keywords: data.keywords,
      frequency: data.frequency,
      active: data.active,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    return NextResponse.json(formattedAlert);
  } catch (error) {
    console.error('Unexpected error in POST /api/job-alerts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}