// app/api/company/application/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { magicLinkService } from '@/lib/services/magicLinkService';

export async function GET(request: NextRequest) {
  try {
    // Extract token from URL path
    const pathname = request.nextUrl.pathname;
    const token = pathname.split('/').pop();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get application data using magic link service
    const applicationData = await magicLinkService.getApplicationForMagicLink(token);

    if (!applicationData) {
      return NextResponse.json({ 
        error: 'Invalid or expired access link' 
      }, { status: 403 });
    }

    return NextResponse.json(applicationData);
  } catch (error) {
    console.error('Error in company application API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

 