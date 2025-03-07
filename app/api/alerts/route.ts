// app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { hasProAccessServer } from '@/lib/subscription';

// GET handler to fetch all alerts for the current user
export async function GET(request: NextRequest) {
  console.log('GET request to /api/alerts');
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has PRO access
    const hasPro = await hasProAccessServer(session.user.id);
    if (!hasPro) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }
    
    // Initialize Supabase client
    const supabase = createServerSupabase();
    
    // Fetch alerts for the current user
    try {
      console.log('Fetching alerts for user:', session.user.id);
      const { data: alerts, error } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching alerts:', error);
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }
      
      console.log(`Found ${alerts?.length || 0} alerts`);
      
      // Format the alerts to match the expected client interface
      const formattedAlerts = alerts?.map(alert => ({
        id: alert.id,
        name: alert.name,
        keywords: alert.keywords,
        frequency: alert.frequency,
        active: alert.active,
        userId: alert.user_id,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at
      })) || [];
      
      return NextResponse.json(formattedAlerts);
    } catch (dbError: any) {
      console.error('Error fetching alerts:', dbError);
      return NextResponse.json(
        { error: `Error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/alerts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST handler to create a new alert
export async function POST(request: NextRequest) {
  console.log('POST request to /api/alerts');
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has PRO access
    const hasPro = await hasProAccessServer(session.user.id);
    if (!hasPro) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }
    
    // Get request body
    const { name, keywords, frequency } = await request.json();
    
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
    try {
      console.log('Creating new alert:', { name, keywords, frequency });
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
        console.error('Supabase error creating alert:', error);
        return NextResponse.json(
          { error: `Database error: ${error.message}`, code: error.code },
          { status: 500 }
        );
      }
      
      console.log('Alert created:', alert);
      
      // Format the alert to match the expected client interface
      const formattedAlert = {
        id: alert.id,
        name: alert.name,
        keywords: alert.keywords,
        frequency: alert.frequency,
        active: alert.active,
        userId: alert.user_id,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at
      };
      
      return NextResponse.json(formattedAlert);
    } catch (dbError: any) {
      console.error('Error creating alert:', dbError);
      return NextResponse.json(
        { error: `Error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/alerts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}