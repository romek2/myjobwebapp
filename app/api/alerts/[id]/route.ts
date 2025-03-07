// app/api/alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasProAccessServer } from '@/lib/subscription';

// Helper function to check if user can access this alert
async function canAccessAlert(userId: string, alertId: string) {
  try {
    const alert = await prisma.jobAlert.findUnique({
      where: {
        id: alertId
      }
    });
    
    return alert?.userId === userId;
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
    
    // Prepare update data
    const updateData: any = {};
    if (body.active !== undefined) updateData.active = body.active;
    if (body.name) updateData.name = body.name;
    if (body.keywords) updateData.keywords = body.keywords;
    if (body.frequency) updateData.frequency = body.frequency;
    
    console.log('Updating alert with data:', updateData);
    
    // Update the alert
    const updatedAlert = await prisma.jobAlert.update({
      where: {
        id: alertId
      },
      data: updateData
    });
    
    console.log('Alert updated:', updatedAlert);
    return NextResponse.json(updatedAlert);
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
    
    // Delete the alert
    await prisma.jobAlert.delete({
      where: {
        id: alertId
      }
    });
    
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