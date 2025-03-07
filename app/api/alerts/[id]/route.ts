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
    .from('job_alerts')
    .select('user_id')
    .eq('id', alertId)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return data.user_id === userId;
}

// PATCH handler - update an alert
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const alertId = context.params.id;
    
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
    const updateData: Record<string, any> = {};
    
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
    
    // If nothing to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase
    const supabase = createServerSupabase();
    
    // Update alert
    const { data, error } = await supabase
      .from('job_alerts')
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
    console.error(`Unexpected error in PATCH /api/job-alerts/[id]:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE handler - delete an alert
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const alertId = context.params.id;
    
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
    
    // Delete the alert
    const { error } = await supabase
      .from('job_alerts')
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