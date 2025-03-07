// app/api/job-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

// Main GET handler - fetches all alerts for a user
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check PRO access directly from the session
    if (session.user.subscriptionStatus !== 'PRO') {
      console.log('User does not have PRO subscription. Status:', session.user.subscriptionStatus);
      
      // DEVELOPMENT OVERRIDE - FOR TESTING ONLY
      // Comment this out to enforce PRO subscriptions
      console.log('⚠️ DEVELOPMENT OVERRIDE: Allowing access despite no PRO subscription');
      // Uncomment the next line to enforce PRO subscriptions
      // return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }
    
    // Initialize Supabase
    const supabase = createServerSupabase();
    
    // Fetch alerts - using camelCase column names from the actual schema
    const { data, error } = await supabase
      .from('JobAlert')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Return data directly - already in camelCase
    return NextResponse.json(data || []);
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
    
    // Check PRO access directly from the session
    if (session.user.subscriptionStatus !== 'PRO') {
      console.log('User does not have PRO subscription. Status:', session.user.subscriptionStatus);
      
      // DEVELOPMENT OVERRIDE - FOR TESTING ONLY
      // Comment this out to enforce PRO subscriptions
      console.log('⚠️ DEVELOPMENT OVERRIDE: Allowing access despite no PRO subscription');
      // Uncomment the next line to enforce PRO subscriptions
      // return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
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
      .from('JobAlert')
      .select('*', { count: 'exact' })
      .eq('userId', session.user.id);
    
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
    
    // Prepare the current timestamp
    const now = new Date().toISOString();
    
    // Create new alert - using camelCase column names from the actual schema
    const { data, error } = await supabase
      .from('JobAlert')
      .insert({
        userId: session.user.id,
        name,
        keywords,
        frequency,
        active: true,
        createdAt: now,
        updatedAt: now
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
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in POST /api/job-alerts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}