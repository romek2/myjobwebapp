// app/api/test-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

// GET handler to test database connection and fetch user info
export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        message: "No user session found",
        authenticated: false 
      });
    }
    
    // Initialize Supabase client
    const supabase = createServerSupabase();
    
    // Try to find the user in the database
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, subscription_status')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        return NextResponse.json({
          message: "Error fetching user from database",
          error: error.message,
          authenticated: true,
          userId: session.user.id
        }, { status: 500 });
      }
      
      // Get count of user's alerts
      const { count: alertCount, error: countError } = await supabase
        .from('job_alerts')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id);
      
      if (countError) {
        return NextResponse.json({
          message: "Error counting alerts",
          error: countError.message,
          user,
          authenticated: true
        }, { status: 500 });
      }
      
      // Check table structure
      const { data: tableInfo, error: tableError } = await supabase
        .from('job_alerts')
        .select('*')
        .limit(1);
      
      let tableStructure = null;
      if (tableInfo && tableInfo.length > 0) {
        tableStructure = Object.keys(tableInfo[0]);
      }
      
      return NextResponse.json({
        message: "Database connection successful",
        user,
        alertCount,
        tableStructure,
        session: {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name
        }
      });
    } catch (dbError: any) {
      return NextResponse.json({
        message: "Error connecting to database",
        error: dbError.message,
        authenticated: true,
        userId: session.user.id
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      message: "Unexpected error",
      error: error.message
    }, { status: 500 });
  }
}

// POST handler to test creating a simple alert
export async function POST(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        message: "No user session found",
        authenticated: false 
      }, { status: 401 });
    }
    
    // Initialize Supabase client
    const supabase = createServerSupabase();
    
    // Get the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = { name: "Test Alert", keywords: "test", frequency: "daily" };
    }
    
    // Try to create a simple alert
    const { data: alert, error } = await supabase
      .from('job_alerts')
      .insert({
        user_id: session.user.id,
        name: body.name || "Test Alert",
        keywords: body.keywords || "test",
        frequency: body.frequency || "daily",
        active: true
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({
        message: "Error creating alert",
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        authenticated: true,
        userId: session.user.id
      }, { status: 500 });
    }
    
    return NextResponse.json({
      message: "Alert created successfully",
      alert
    });
  } catch (error: any) {
    return NextResponse.json({
      message: "Unexpected error",
      error: error.message
    }, { status: 500 });
  }
}