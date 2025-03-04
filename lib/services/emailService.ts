// lib/services/emailService.ts
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface JobAlertEmailData {
  email: string;
  userName: string;
  alertName: string;
  jobs: {
    title: string;
    company: string;
    location: string;
    salary?: string;
    url: string;
  }[];
}

/**
 * Sends a job alert email with matching premium jobs
 */
export async function sendJobAlertEmail(data: JobAlertEmailData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.FROM_EMAIL) {
      console.error('Missing SendGrid API key or sender email in environment variables');
      return false;
    }

    const { email, userName, alertName, jobs } = data;

    // Generate job listings HTML
    const jobsHtml = jobs.map(job => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin-top: 0; margin-bottom: 8px; color: #1e40af;">${job.title}</h3>
        <p style="margin-top: 0; margin-bottom: 8px; color: #4b5563;">${job.company} • ${job.location}</p>
        ${job.salary ? `<p style="margin-top: 0; margin-bottom: 12px; color: #047857; font-weight: 500;">${job.salary}</p>` : ''}
        <a href="${process.env.NEXTAUTH_URL}${job.url}" style="display: inline-block; padding: 8px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">View Job</a>
      </div>
    `).join('');

    // Create email message
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL,
      subject: `New Premium Jobs Matching "${alertName}"`,
      text: `Hello ${userName || 'there'}! We found ${jobs.length} new premium job opportunities matching your "${alertName}" alert.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 20px; background-color: #4f46e5; text-align: center;">
            <h1 style="color: white; margin: 0;">Premium Job Alerts</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Hello ${userName || 'there'}!</p>
            
            <p style="font-size: 16px;">We found <strong>${jobs.length} new premium job ${jobs.length === 1 ? 'opportunity' : 'opportunities'}</strong> matching your "${alertName}" alert:</p>
            
            <div style="margin-top: 24px; margin-bottom: 24px;">
              ${jobsHtml}
            </div>
            
            <p style="font-size: 16px;">
              <a href="${process.env.NEXTAUTH_URL}/alerts" style="color: #3b82f6; text-decoration: none;">Manage your job alerts</a>
            </p>
          </div>
          
          <div style="padding: 15px; background-color: #f3f4f6; text-align: center; font-size: 14px; color: #6b7280;">
            <p>Thank you for being a PRO subscriber!</p>
            <p>You received this email because you set up job alerts on our platform.</p>
          </div>
        </div>
      `,
    };

    // Send the email
    await sgMail.send(msg);
    console.log(`Job alert email sent to ${email} for alert "${alertName}"`);
    return true;
  } catch (error) {
    console.error('Error sending job alert email:', error);
    return false;
  }
}