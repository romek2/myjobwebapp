// app/api/test-sendgrid-direct/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import sgMail from '@sendgrid/mail';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the form data
    const { apiKey, fromEmail, testMessage } = await req.json();

    // Validate inputs
    if (!apiKey || !fromEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Both API Key and From Email are required'
      }, { status: 400 });
    }

    // Validate API key format
    if (!apiKey.startsWith('SG.')) {
      return NextResponse.json({ 
        error: 'Invalid API Key format',
        details: 'SendGrid API keys should start with "SG."'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      return NextResponse.json({ 
        error: 'Invalid email format',
        details: 'From Email must be a valid email address'
      }, { status: 400 });
    }

    const userEmail = session.user.email;
    const userName = session.user.name || 'User';

    console.log(`Testing SendGrid with API key: ${apiKey.substring(0, 10)}...`);
    console.log(`From email: ${fromEmail}`);
    console.log(`To email: ${userEmail}`);

    // Set the API key for this request
    sgMail.setApiKey(apiKey);

    // Create the test email
    const msg = {
      to: userEmail,
      from: fromEmail,
      subject: `Direct Test Email - ${new Date().toLocaleTimeString()}`,
      text: `Hello ${userName}!

This is a direct test of your SendGrid configuration.

Test Details:
- API Key: ${apiKey.substring(0, 15)}...
- From Email: ${fromEmail}
- To Email: ${userEmail}
- Sent at: ${new Date().toISOString()}
- Custom Message: ${testMessage || 'No custom message provided'}

If you received this email, your SendGrid configuration is working correctly!

Best regards,
Your Website Test System`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #4a6cf7; margin-bottom: 20px;">✅ Direct SendGrid Test Successful!</h2>
            
            <p>Hello <strong>${userName}</strong>!</p>
            
            <p>This is a direct test of your SendGrid configuration.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a6cf7;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Test Details:</h3>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                <li><strong>API Key:</strong> ${apiKey.substring(0, 15)}...</li>
                <li><strong>From Email:</strong> ${fromEmail}</li>
                <li><strong>To Email:</strong> ${userEmail}</li>
                <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
                ${testMessage ? `<li><strong>Custom Message:</strong> ${testMessage}</li>` : ''}
              </ul>
            </div>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; border: 1px solid #c3e6cb; margin: 20px 0;">
              <p style="margin: 0; color: #155724;">
                🎉 <strong>Success!</strong> If you received this email, your SendGrid configuration is working correctly!
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              Your Website Test System
            </p>
          </div>
        </div>
      `
    };

    // Send the email
    const response = await sgMail.send(msg);
    
    console.log('SendGrid response status:', response[0].statusCode);
    console.log('SendGrid response headers:', response[0].headers);

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${userEmail}`,
      details: {
        statusCode: response[0].statusCode,
        messageId: response[0].headers['x-message-id'],
        fromEmail: fromEmail,
        toEmail: userEmail,
        apiKeyPreview: apiKey.substring(0, 15) + '...',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('SendGrid direct test error:', error);

    // Handle SendGrid-specific errors
    if (error.response) {
      const sendGridError = error.response.body;
      console.error('SendGrid API Error Details:', sendGridError);
      
      return NextResponse.json({
        error: 'SendGrid API Error',
        details: sendGridError.errors || sendGridError,
        statusCode: error.code,
        help: getSendGridErrorHelp(sendGridError)
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to send test email',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to provide helpful error messages
function getSendGridErrorHelp(error: any): string {
  if (!error.errors || !Array.isArray(error.errors)) {
    return 'Check your SendGrid configuration';
  }

  const firstError = error.errors[0];
  
  if (firstError.field === 'from' && firstError.message.includes('verified Sender Identity')) {
    return 'Your from email address needs to be verified in SendGrid. Go to Settings → Sender Authentication and either verify your domain or create a Single Sender.';
  }
  
  if (firstError.message.includes('API key')) {
    return 'Your API key appears to be invalid. Check that it starts with "SG." and has the correct permissions in SendGrid Dashboard → Settings → API Keys.';
  }
  
  if (firstError.field === 'personalizations' || firstError.field === 'to') {
    return 'There seems to be an issue with the recipient email address.';
  }
  
  return 'Check your SendGrid configuration and make sure your domain/sender is verified.';
}