// app/api/debug-env/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check all environment variables
    const envCheck = {
      // SendGrid
      SENDGRID_API_KEY: {
        exists: !!process.env.SENDGRID_API_KEY,
        length: process.env.SENDGRID_API_KEY?.length || 0,
        prefix: process.env.SENDGRID_API_KEY?.substring(0, 10) || 'Not found',
        isValid: process.env.SENDGRID_API_KEY?.startsWith('SG.') || false
      },
      SENDGRID_FROM_EMAIL: {
        exists: !!process.env.SENDGRID_FROM_EMAIL,
        value: process.env.SENDGRID_FROM_EMAIL || 'Not found',
        isEmail: process.env.SENDGRID_FROM_EMAIL?.includes('@') || false
      },
      
      // Other important env vars
      NEXTAUTH_URL: {
        exists: !!process.env.NEXTAUTH_URL,
        value: process.env.NEXTAUTH_URL || 'Not found'
      },
      NEXTAUTH_SECRET: {
        exists: !!process.env.NEXTAUTH_SECRET,
        length: process.env.NEXTAUTH_SECRET?.length || 0
      },
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      
      // All env vars that start with SENDGRID
      allSendGridVars: Object.keys(process.env)
        .filter(key => key.startsWith('SENDGRID'))
        .reduce((acc, key) => {
          acc[key] = {
            exists: true,
            length: process.env[key]?.length || 0,
            preview: process.env[key]?.substring(0, 20) + '...' || ''
          };
          return acc;
        }, {} as Record<string, any>)
    };

    // Security note: Only show this to authenticated users
    // and mask sensitive data
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString(),
      user: session.user.email,
      envCheck
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug check failed',
      details: error.message
    }, { 
      status: 500 
    });
  }
}