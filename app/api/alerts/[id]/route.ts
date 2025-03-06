// app/api/alerts/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { hasProAccessServer } from '@/lib/subscription';

// Note: Using explicit parameter/type naming to match Next.js expectations
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check PRO status
    const hasPro = await hasProAccessServer(session.user.id);
    if (!hasPro) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }
    
    // Get data from Supabase
    const supabase = createServerSupabase();
    
    const { data: alert, error } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (error || !alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check PRO status
    const hasPro = await hasProAccessServer(session.user.id);
    if (!hasPro) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }
    
    // Verify ownership and update
    const supabase = createServerSupabase();
    
    // First check if alert exists and belongs to user
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
    
    // Get update data
    const updateData = await request.json();
    
    // Validate fields
    const allowedUpdates = ['active', 'name', 'keywords', 'frequency'];
    const sanitizedUpdate: Record<string, any> = {};
    
    for (const key of allowedUpdates) {
      if (key in updateData) {
        sanitizedUpdate[key] = updateData[key];
      }
    }
    
    // Update alert
    const { data: updatedAlert, error: updateError } = await supabase
      .from('job_alerts')
      .update(sanitizedUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check PRO status
    const hasPro = await hasProAccessServer(session.user.id);
    if (!hasPro) {
      return NextResponse.json({ error: 'PRO subscription required' }, { status: 403 });
    }
    
    // Verify ownership and delete
    const supabase = createServerSupabase();
    
    // First check if alert exists and belongs to user
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
    
    // Delete alert
    const { error: deleteError } = await supabase
      .from('job_alerts')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete alert' },
        { status: 500 }
      );
    }
    
    // Also delete related history
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