// app/api/company/application/[token]/update/route.ts - COMPLETE FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { magicLinkService } from '@/lib/services/magicLinkService';
import { notificationService } from '@/lib/services/notificationService';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Extract token from URL path
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const token = segments[segments.length - 2]; // token is second to last segment

    console.log(`🔄 Company updating application with token: ${token}`);

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Validate magic link
    const linkData = await magicLinkService.validateMagicLink(token);
    if (!linkData) {
      console.log('❌ Invalid or expired magic link');
      return NextResponse.json({ 
        error: 'Invalid or expired access link' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { status, companyNotes, interviewDate, interviewer, location } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    console.log(`📝 Updating application ${linkData.applicationId} to status: ${status}`);

    const supabase = createServerSupabase();

    // Convert application ID to handle both string and number types
    const applicationIdString = linkData.applicationId;
    const applicationIdNumber = parseInt(applicationIdString);
    
    // Try to find the application with both ID formats
    let { data: existingApp, error: findError } = await supabase
      .from('user_job_applications')
      .select('*')
      .eq('id', applicationIdString)
      .single();

    // If string ID failed, try numeric ID
    if (findError && !isNaN(applicationIdNumber)) {
      console.log('🔄 Trying numeric application ID...');
      const numericResult = await supabase
        .from('user_job_applications')
        .select('*')
        .eq('id', applicationIdNumber)
        .single();
      
      if (!numericResult.error && numericResult.data) {
        existingApp = numericResult.data;
        findError = null;
      }
    }

    if (findError || !existingApp) {
      console.error('❌ Application not found:', findError?.message);
      return NextResponse.json({ 
        error: 'Application not found' 
      }, { status: 404 });
    }

    // Update application status
    const updateData: any = {
      status,
      status_updated_at: new Date().toISOString()
    };

    if (companyNotes) {
      updateData.company_notes = companyNotes;
    }

    if (status === 'interview' && interviewDate) {
      updateData.interview_date = new Date(interviewDate).toISOString();
      updateData.interviewer_name = interviewer || null;
      updateData.interview_location = location || null;
    }

    // Use the correct ID format for the update
    const updateId = existingApp.id;
    console.log(`💾 Updating application with ID: ${updateId} (type: ${typeof updateId})`);

    const { data: application, error: updateError } = await supabase
      .from('user_job_applications')
      .update(updateData)
      .eq('id', updateId)
      .select(`
        *,
        user:user_id (
          name,
          email,
          subscriptionStatus
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Error updating application:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Application updated successfully to status: ${status}`);

    // Send notification to user
    try {
      await notificationService.handleStatusUpdate(
        String(application.id), // Ensure string for notification service
        status,
        companyNotes,
        interviewDate
      );
      console.log('✅ Notification sent to user');
    } catch (notificationError) {
      console.error('⚠️ Error sending notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Mark magic link as used (optional security measure)
    try {
      await magicLinkService.markTokenAsUsed(token);
    } catch (tokenError) {
      console.error('⚠️ Error marking token as used:', tokenError);
      // Don't fail the request if token marking fails
    }

    return NextResponse.json({ 
      success: true, 
      application: {
        id: String(application.id), // Ensure string in response
        status: application.status,
        updatedAt: application.status_updated_at
      }
    });

  } catch (error) {
    console.error('💥 Error updating application status:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}