// app/api/test-simple-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userEmail = session.user.email;
    const userName = session.user.name || 'User';
    
    console.log(`Attempting to send test email to ${userName} (${userEmail})`);
    
    // Create a simple test email
    const msg = {
      to: userEmail,
      from: process.env.SENDGRID_FROM_EMAIL as string,
      subject: 'Test Email from Your Website',
      text: `Hello ${userName}!\n\nThis is a simple test email to verify that SendGrid is working correctly.\n\nSent at: ${new Date().toISOString()}\n\nBest regards,\nYour Website`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4a6cf7;">Email Test Successful! 🎉</h2>
          <p>Hello ${userName}!</p>
          <p>This is a simple test email to verify that SendGrid is working correctly.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Test Details:</strong></p>
            <ul style="margin: 10px 0;">
              <li>Sent to: ${userEmail}</li>
              <li>From: ${process.env.SENDGRID_FROM_EMAIL}</li>
              <li>Time: ${new Date().toLocaleString()}</li>
              <li>Status: ✅ SendGrid API call successful</li>
            </ul>
          </div>
          
          <p>If you received this email, your SendGrid integration is working perfectly!</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            Your Website Team
          </p>
        </div>
      `,
    };
    
    // Send the email
    const response = await sgMail.send(msg);
    
    console.log('SendGrid response:', response[0].statusCode);
    
    return NextResponse.json({ 
      success: true, 
      message: `Test email sent successfully to ${userEmail}`,
      details: {
        recipient: userEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        statusCode: response[0].statusCode,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('Error sending test email:', error);
    
    // SendGrid-specific error handling
    if (error.response) {
      console.error('SendGrid API Error:', error.response.body);
      return NextResponse.json({ 
        error: 'SendGrid API error',
        details: error.response.body?.errors || error.message,
        statusCode: error.code
      }, { 
        status: 400 
      });
    }
    
    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error.message
    }, { 
      status: 500 
    });
  }
}

export async function GET(req: NextRequest) {
  // Simple GET endpoint to check configuration
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check environment variables
    const hasApiKey = !!process.env.SENDGRID_API_KEY;
    const hasFromEmail = !!process.env.SENDGRID_FROM_EMAIL;
    
    return NextResponse.json({
      config: {
        hasApiKey,
        hasFromEmail,
        fromEmail: process.env.SENDGRID_FROM_EMAIL,
        userEmail: session.user.email,
        userName: session.user.name
      },
      ready: hasApiKey && hasFromEmail
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Configuration check failed',
      details: error.message
    }, { 
      status: 500 
    });
  }
}