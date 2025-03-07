// app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasProAccessServer } from '@/lib/subscription';

// GET handler to fetch all alerts for the current user
export async function GET(request: NextRequest) {
  console.log('GET request to /api/alerts');
  try {
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
    
    // Fetch alerts for the current user
    try {
      console.log('Fetching alerts for user:', session.user.id);
      const alerts = await prisma.jobAlert.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`Found ${alerts.length} alerts`);
      return NextResponse.json(alerts);
    } catch (dbError: any) {
      console.error('Database error fetching alerts:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/alerts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST handler to create a new alert
export async function POST(request: NextRequest) {
  console.log('POST request to /api/alerts');
  try {
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
    
    // Get request body
    const { name, keywords, frequency } = await request.json();
    
    // Validate required fields
    if (!name || !keywords || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate frequency value
    const validFrequencies = ['daily', 'weekly', 'realtime'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency value' },
        { status: 400 }
      );
    }
    
    // Check if the user has reached the limit of 10 alerts
    const alertCount = await prisma.jobAlert.count({
      where: {
        userId: session.user.id
      }
    });
    
    if (alertCount >= 10) {
      return NextResponse.json(
        { error: 'You have reached the maximum limit of 10 job alerts' },
        { status: 400 }
      );
    }
    
    // Create the new alert
    try {
      console.log('Creating new alert:', { name, keywords, frequency });
      const alert = await prisma.jobAlert.create({
        data: {
          userId: session.user.id,
          name,
          keywords,
          frequency,
          active: true
        }
      });
      
      console.log('Alert created:', alert);
      return NextResponse.json(alert);
    } catch (dbError: any) {
      console.error('Database error creating alert:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}`, code: dbError.code },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/alerts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}