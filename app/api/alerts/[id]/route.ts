// app/api/alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { hasProAccessServer } from '@/lib/subscription';

// PATCH handler to update an alert (e.g., toggle active state)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
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
    
    // Verify the alert belongs to the user
    const { data: existingAlert, error: fetchError } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (fetchError || !existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get update data from request
    const updateData = await request.json();
    
    // Ensure only allowed fields are updated
    const allowedUpdates = ['active', 'name', 'keywords', 'frequency'];
    const sanitizedUpdate: Record<string, any> = {};
    
    for (const key of allowedUpdates) {
      if (key in updateData) {
        sanitizedUpdate[key] = updateData[key];
      }
    }
    
    // Update the alert
    const { data: updatedAlert, error: updateError } = await supabase
      .from('job_alerts')
      .update(sanitizedUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating alert:', updateError);
      return NextResponse.json(
        { error: 'Failed to update alert' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error(`Error in PATCH /api/alerts/[id]:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove an alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
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
    
    // Verify the alert belongs to the user
    const { data: existingAlert, error: fetchError } = await supabase
      .from('job_alerts')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (fetchError || !existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }
    
    // Delete the alert
    const { error: deleteError } = await supabase
      .from('job_alerts')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting alert:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete alert' },
        { status: 500 }
      );
    }
    
    // Also delete any alert history
    await supabase
      .from('job_alert_history')
      .delete()
      .eq('alert_id', id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in DELETE /api/alerts/[id]:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET handler to retrieve a specific alert
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
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
    
    // Fetch the alert with history
    const { data: alert, error } = await supabase
      .from('job_alerts')
      .select(`
        *,
        job_alert_history(
          id,
          job_id,
          sent_at
        )
      `)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (error || !alert) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error(`Error in GET /api/alerts/[id]:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}