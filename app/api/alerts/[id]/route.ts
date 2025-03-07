// app/api/alerts/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasProAccessServer } from '@/lib/subscription';

// Helper function to check if user can access this alert
async function canAccessAlert(userId: string, alertId: string) {
  const alert = await prisma.jobAlert.findUnique({
    where: {
      id: alertId
    }
  });
  
  return alert?.userId === userId;
}

// PATCH handler to update an alert
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id;
    
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
    
    // Validate active status if present
    if (body.active !== undefined && typeof body.active !== 'boolean') {
      return NextResponse.json(
        { error: 'Active status must be a boolean' },
        { status: 400 }
      );
    }
    
    // Update the alert
    const updatedAlert = await prisma.jobAlert.update({
      where: {
        id: alertId
      },
      data: {
        active: body.active !== undefined ? body.active : undefined,
        name: body.name || undefined,
        keywords: body.keywords || undefined,
        frequency: body.frequency || undefined
      }
    });
    
    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error(`Error in PATCH /api/alerts/${params.id}:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete an alert
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id;
    
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
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in DELETE /api/alerts/${params.id}:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}