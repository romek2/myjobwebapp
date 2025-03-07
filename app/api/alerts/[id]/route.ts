// app/api/alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { hasProAccessServer } from '@/lib/subscription';

// Helper function to check if user can access this alert
async function canAccessAlert(userId: string, alertId: string) {
  try {
    const supabase = createServerSupabase();
    const { data: alert, error } = await supabase
      .from('job_alerts')
      .select('user_id')
      .eq('id', alertId)
      .single();
    
    if (error) {
      console.error('Error checking alert access:', error);
      return false;
    }
    
    return alert?.user_id === userId;
  } catch (error) {
    console.error('Error checking alert access:', error);
    return false;
  }
}

// PATCH handler to update an alert
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id;
    console.log('PATCH request for alert:', alertId);
    
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
    
    // Check if user owns this alert
    const hasAccess = await canAccessAlert(session.user.id, alertId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    // Get request body
    const body = await request.json();
    console.log('Update body:', body);
    
    // Validate active status if present
    if (body.active !== undefined && typeof body.active !== 'boolean') {
      return NextResponse.json(
        { error: 'Active status must be a boolean' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createServerSupabase();
    
    // Prepare update data
    const updateData: any = {};
    if (body.active !== undefined) updateData.active = body.active;
    if (body.name) updateData.name = body.name;
    if (body.keywords) updateData.keywords = body.keywords;
    if (body.frequency) updateData.frequency = body.frequency;
    
    console.log('Updating alert with data:', updateData);
    
    // Update the alert
    const { data: updatedAlert, error } = await supabase
      .from('job_alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating alert:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Format the alert to match the expected client interface
    const formattedAlert = {
      id: updatedAlert.id,
      name: updatedAlert.name,
      keywords: updatedAlert.keywords,
      frequency: updatedAlert.frequency,
      active: updatedAlert.active,
      userId: updatedAlert.user_id,
      createdAt: updatedAlert.created_at,
      updatedAt: updatedAlert.updated_at
    };
    
    console.log('Alert updated:', formattedAlert);
    return NextResponse.json(formattedAlert);
  } catch (error: any) {
    console.error(`Error in PATCH /api/alerts/${params?.id}:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE handler to delete an alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id;
    console.log('DELETE request for alert:', alertId);
    
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
    
    // Check if user owns this alert
    const hasAccess = await canAccessAlert(session.user.id, alertId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    // Initialize Supabase client
    const supabase = createServerSupabase();
    
    // Delete the alert
    const { error } = await supabase
      .from('job_alerts')
      .delete()
      .eq('id', alertId);
    
    if (error) {
      console.error('Error deleting alert:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('Alert deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error in DELETE /api/alerts/${params?.id}:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}