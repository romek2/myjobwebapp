// app/api/test-alerts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET handler to test database connection and fetch user info
export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        message: "No user session found",
        authenticated: false 
      });
    }
    
    // Try to find the user in the database
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionStatus: true
        }
      });
      
      // Get count of user's alerts
      const alertCount = await prisma.jobAlert.count({
        where: { userId: session.user.id }
      });
      
      return NextResponse.json({
        message: "Database connection successful",
        user,
        alertCount,
        session: {
          ...session,
          // Don't expose any sensitive data that might be in the session
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
export async function POST(request: Request) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        message: "No user session found",
        authenticated: false 
      }, { status: 401 });
    }
    
    // Get the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = { name: "Test Alert", keywords: "test", frequency: "daily" };
    }
    
    try {
      // Try to create a simple alert
      const alert = await prisma.jobAlert.create({
        data: {
          userId: session.user.id,
          name: body.name || "Test Alert",
          keywords: body.keywords || "test",
          frequency: body.frequency || "daily",
          active: true
        }
      });
      
      return NextResponse.json({
        message: "Alert created successfully",
        alert
      });
    } catch (dbError: any) {
      return NextResponse.json({
        message: "Error creating alert",
        error: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
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