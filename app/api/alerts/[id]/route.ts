// app/api/job-alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { hasProAccessServer } from '@/lib/subscription';

// Helper function to check if user owns an alert
async function userOwnsAlert(userId: string, alertId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('JobAlert')
    .select('userId')
    .eq('id', alertId)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return data.userId === userId;
}

// Helper to extract ID from the URL path
function getIdFromPath(request: NextRequest): string {
  // Get the pathname (e.g., /api/job-alerts/abc123)
  const pathname = request.nextUrl.pathname;
  // Split by / and get the last segment
  const segments = pathname.split('/');
  return segments[segments.length - 1];
}

// PATCH handler - update an alert
export async function PATCH(request: NextRequest) {
  try {
    const alertId = getIdFromPath(request);
    console.log('Updating alert with ID:', alertId);
    
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
    
    // Check alert ownership
    const hasAccess = await userOwnsAlert(session.user.id, alertId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };
    
    if (body.active !== undefined) {
      if (typeof body.active !== 'boolean') {
        return NextResponse.json(
          { error: 'Active must be a boolean' },
          { status: 400 }
        );
      }
      updateData.active = body.active;
    }
    
    if (body.name) {
      updateData.name = body.name;
    }
    
    if (body.keywords) {
      updateData.keywords = body.keywords;
    }
    
    if (body.frequency) {
      const validFrequencies = ['daily', 'weekly', 'realtime'];
      if (!validFrequencies.includes(body.frequency)) {
        return NextResponse.json(
          { error: 'Invalid frequency value' },
          { status: 400 }
        );
      }
      updateData.frequency = body.frequency;
    }
    
    // Initialize Supabase
    const supabase = createServerSupabase();
    
    // Update alert - using camelCase column names from the actual schema
    const { data, error } = await supabase
      .from('JobAlert')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating alert ${alertId}:`, error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Unexpected error in PATCH /api/job-alerts/[id]:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE handler - delete an alert
export async function DELETE(request: NextRequest) {
  try {
    const alertId = getIdFromPath(request);
    console.log('Deleting alert with ID:', alertId);
    
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
    
    // Check alert ownership
    const hasAccess = await userOwnsAlert(session.user.id, alertId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }
    
    // Initialize Supabase
    const supabase = createServerSupabase();
    
    // Delete the alert - from the actual schema
    const { error } = await supabase
      .from('JobAlert')
      .delete()
      .eq('id', alertId);
    
    if (error) {
      console.error(`Error deleting alert ${alertId}:`, error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Unexpected error in DELETE /api/job-alerts/[id]:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}