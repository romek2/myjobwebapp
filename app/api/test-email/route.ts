// app/api/schedule-email/route.ts
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
    
    // Calculate the time 1 minute from now
    const scheduledTime = new Date(Date.now() + 60000); // 60000 ms = 1 minute
    
    // Log the scheduled time
    console.log(`Email scheduled for ${userName} (${userEmail}) at ${scheduledTime.toISOString()}`);
    
    // Create the email
    const msg = {
      to: userEmail,
      from: process.env.SENDGRID_FROM_EMAIL as string,
      subject: 'Workr - Scheduled Test Email',
      text: `Hello ${userName},\n\nThis is a scheduled test email from Workr, sent approximately 1 minute after you requested it.\n\nScheduled at: ${new Date().toISOString()}\nExpected delivery: ${scheduledTime.toISOString()}\n\nThank you,\nThe Workr Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6cf7;">Workr</h2>
          <p>Hello ${userName},</p>
          <p>This is a scheduled test email from Workr, sent approximately 1 minute after you requested it.</p>
          <p><strong>Scheduled at:</strong> ${new Date().toISOString()}<br>
          <strong>Expected delivery:</strong> ${scheduledTime.toISOString()}</p>
          <p>Thank you,<br>The Workr Team</p>
        </div>
      `,
    };
    
    // Set a timeout to send the email after 1 minute
    setTimeout(async () => {
      try {
        await sgMail.send(msg);
        console.log(`Scheduled email sent to ${userEmail} at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('Error sending scheduled email:', error);
      }
    }, 60000); // 60000 ms = 1 minute
    
    return NextResponse.json({ 
      success: true, 
      message: `Email scheduled to be sent to ${userEmail} in 1 minute`,
      scheduledTime: scheduledTime.toISOString()
    });
  } catch (error: any) {
    console.error('Error scheduling email:', error);
    
    return NextResponse.json({ 
      error: 'Failed to schedule email',
      details: error.message,
      response: error.response?.body || null
    }, { 
      status: 500 
    });
  }
}