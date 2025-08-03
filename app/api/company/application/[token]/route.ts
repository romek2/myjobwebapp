// app/api/company/application/[token]/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { magicLinkService } from '@/lib/services/magicLinkService';

export async function GET(request: NextRequest) {
  try {
    // Extract token from URL path
    const pathname = request.nextUrl.pathname;
    const token = pathname.split('/').pop();

    console.log(`🔍 Company portal request for token: ${token}`);

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get application data using magic link service
    const applicationData = await magicLinkService.getApplicationForMagicLink(token);

    console.log(`📊 Application data result:`, {
      hasData: !!applicationData,
      application: applicationData?.application ? 'exists' : 'null',
      job: applicationData?.job ? 'exists' : 'null',
      linkData: applicationData?.linkData ? 'exists' : 'null'
    });

    if (!applicationData) {
      console.log('❌ No application data returned from magic link service');
      return NextResponse.json({ 
        error: 'Invalid or expired access link' 
      }, { status: 403 });
    }

    // Additional validation to check if application exists
    if (!applicationData.application) {
      console.log('❌ Application object is null in response');
      return NextResponse.json({ 
        error: 'Application not found' 
      }, { status: 404 });
    }

    // Validate that application has required fields
    if (!applicationData.application.company) {
      console.log('❌ Application missing company field');
      console.log('Application object:', JSON.stringify(applicationData.application, null, 2));
      return NextResponse.json({ 
        error: 'Invalid application data - missing company information' 
      }, { status: 500 });
    }

    console.log(`✅ Successfully loaded application for company: ${applicationData.application.company}`);
    
    return NextResponse.json(applicationData);
  } catch (error) {
    console.error('💥 Error in company application API:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}