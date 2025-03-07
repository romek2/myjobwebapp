// app/api/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function GET(req: NextRequest) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userEmail = session.user.email;
    const userName = session.user.name || 'User';
    
    // Create the email
    const msg = {
      to: userEmail,
      from: process.env.SENDGRID_FROM_EMAIL as string, // Must be verified in SendGrid
      subject: 'JobMatcher - Test Email',
      text: `Hello ${userName},\n\nThis is a test email from JobMatcher to verify our email system is working correctly.\n\nThank you,\nThe JobMatcher Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6cf7;">JobMatcher</h2>
          <p>Hello ${userName},</p>
          <p>This is a test email from JobMatcher to verify our email system is working correctly.</p>
          <p>Thank you,<br>The JobMatcher Team</p>
        </div>
      `,
    };
    
    // Send the email
    await sgMail.send(msg);
    
    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${userEmail}` 
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    
    // Return more details about the error
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error.message,
      response: error.response?.body || null
    }, { 
      status: 500 
    });
  }
}