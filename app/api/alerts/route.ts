// app/api/alerts/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

// GET handler to fetch all alerts for the current user
export async function GET(request: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initialize Supabase client
    const supabase = createServerSupabase();
    
    // Check if the user has PRO access
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !user || user.subscription_status !== 'PRO') {
      return NextResponse.json(
        { error: 'PRO subscription required' },
        { status: 403 }
      );
    }
    
    // Fetch alerts for the current user
    const { data: alerts, error } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(alerts || []);
  } catch (error) {
    console.error('Error in GET /api/alerts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST handler to create a new alert
export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const data = await request.json();
    const { name, keywords, frequency } = data;
    
    console.log('Creating alert:', { name, keywords, frequency });
    
    // Validate required fields
    if (!name || !keywords || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate frequency value
    const validFrequencies = ['daily', 'weekly', 'realtime'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency value' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createServerSupabase();
    
    // Check if the user has PRO access
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !user || user.subscription_status !== 'PRO') {
      return NextResponse.json(
        { error: 'PRO subscription required' },
        { status: 403 }
      );
    }
    
    // Check if the user has reached the limit of 10 alerts
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
    
    // Create the new alert
    const { data: alert, error } = await supabase
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
        { error: 'Failed to create alert' },
        { status: 500 }
      );
    }
    
    console.log('Alert created successfully:', alert);
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error in POST /api/alerts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}