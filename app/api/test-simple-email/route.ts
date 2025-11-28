import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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
    
    console.log(`📧 Attempting to send test email to ${userName} (${userEmail})`);
    
    // Check environment variables
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY not configured',
        details: 'Please add RESEND_API_KEY to your environment variables'
      }, { status: 500 });
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json({ 
        error: 'RESEND_FROM_EMAIL not configured',
        details: 'Please add RESEND_FROM_EMAIL to your environment variables'
      }, { status: 500 });
    }
    
    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: userEmail,
      subject: 'Test Email from WorkR (Resend)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Email Test Successful!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #374151; margin-top: 0;">Hello ${userName}!</h2>
            <p style="color: #6b7280; line-height: 1.6;">
              This is a test email to verify that your Resend integration is working correctly. 
              If you're reading this, everything is set up perfectly! ✨
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; color: #374151;"><strong>Test Details:</strong></p>
              <ul style="margin: 10px 0; color: #6b7280; padding-left: 20px;">
                <li>Sent to: ${userEmail}</li>
                <li>From: ${process.env.RESEND_FROM_EMAIL}</li>
                <li>Time: ${new Date().toLocaleString()}</li>
                <li>Status: ✅ Resend API call successful</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Your WorkR application is now ready to send:
            </p>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>Job application confirmations</li>
              <li>Employer notifications</li>
              <li>Status update emails</li>
              <li>And more!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            <p>Sent from WorkR • Powered by Resend</p>
          </div>
        </div>
      `,
    });
    
    if (error) {
      console.error('❌ Resend API Error:', error);
      return NextResponse.json({ 
        error: 'Resend API error',
        details: error
      }, { status: 400 });
    }
    
    console.log('✅ Email sent successfully:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: `Test email sent successfully to ${userEmail}`,
      details: {
        recipient: userEmail,
        from: process.env.RESEND_FROM_EMAIL,
        messageId: data?.id,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('💥 Error sending test email:', error);
    
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
    const hasApiKey = !!process.env.RESEND_API_KEY;
    const hasFromEmail = !!process.env.RESEND_FROM_EMAIL;
    
    return NextResponse.json({
      hasApiKey,
      hasFromEmail,
      fromEmail: process.env.RESEND_FROM_EMAIL,
      userEmail: session.user.email,
      userName: session.user.name,
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