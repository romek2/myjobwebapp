// lib/services/emailService.js
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Sends a job alert email with matching jobs
 * @param {string} userEmail - Recipient's email address
 * @param {string} userName - Recipient's name
 * @param {string} alertName - Name of the job alert
 * @param {Array} matchingJobs - Array of job objects that match the alert criteria
 * @returns {Promise<boolean>} - Success status
 */
async function sendJobAlertEmail(userEmail, userName, alertName, matchingJobs) {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('Missing SendGrid API key or sender email');
      return false;
    }

    // Format jobs for email
    const jobsHtml = matchingJobs.map(job => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin-top: 0; margin-bottom: 8px; color: #1e40af;">${job.title}</h3>
        <p style="margin-top: 0; margin-bottom: 8px; color: #4b5563;">${job.company} • ${job.location || 'Remote'}</p>
        ${job.salary ? `<p style="margin-top: 0; margin-bottom: 12px; color: #047857; font-weight: 500;">${job.salary}</p>` : ''}
        <a href="${process.env.NEXTAUTH_URL}/jobs/${job.id}" style="display: inline-block; padding: 8px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">View Job</a>
      </div>
    `).join('');

    // Create email message
    const msg = {
      to: userEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `New Jobs Matching "${alertName}"`,
      text: `Hello ${userName || 'there'}! We found ${matchingJobs.length} new job opportunities matching your "${alertName}" alert.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 20px; background-color: #4f46e5; text-align: center;">
            <h1 style="color: white; margin: 0;">JobMatcher Alerts</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Hello ${userName || 'there'}!</p>
            
            <p style="font-size: 16px;">We found <strong>${matchingJobs.length} new job ${matchingJobs.length === 1 ? 'opportunity' : 'opportunities'}</strong> matching your "${alertName}" alert:</p>
            
            <div style="margin-top: 24px; margin-bottom: 24px;">
              ${jobsHtml}
            </div>
            
            <p style="font-size: 16px;">
              <a href="${process.env.NEXTAUTH_URL}/alerts" style="color: #3b82f6; text-decoration: none;">Manage your job alerts</a>
            </p>
          </div>
          
          <div style="padding: 15px; background-color: #f3f4f6; text-align: center; font-size: 14px; color: #6b7280;">
            <p>Thank you for using JobMatcher!</p>
            <p>To unsubscribe from these notifications, update your <a href="${process.env.NEXTAUTH_URL}/alerts" style="color: #3b82f6;">alert preferences</a>.</p>
          </div>
        </div>
      `
    };

    // Send the email
    const response = await sgMail.send(msg);
    console.log(`Job alert email sent to ${userEmail} for alert "${alertName}"`);
    return true;
  } catch (error) {
    console.error('Error sending job alert email:', error);
    return false;
  }
}

/**
 * Sends a welcome email to new users
 * @param {string} userEmail - Recipient's email address
 * @param {string} userName - Recipient's name
 * @returns {Promise<boolean>} - Success status
 */
async function sendWelcomeEmail(userEmail, userName) {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('Missing SendGrid API key or sender email');
      return false;
    }

    const msg = {
      to: userEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Welcome to JobMatcher!',
      text: `Hi ${userName || 'there'}! Welcome to JobMatcher, your personal job search assistant.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 20px; background-color: #4f46e5; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to JobMatcher!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Hi ${userName || 'there'}!</p>
            
            <p style="font-size: 16px;">Thank you for joining JobMatcher. We're excited to help you find your perfect job match!</p>
            
            <p style="font-size: 16px;">Here's what you can do with JobMatcher:</p>
            
            <ul style="font-size: 16px; line-height: 1.5;">
              <li>Search for jobs based on your skills and preferences</li>
              <li>Create job alerts to get notified about new opportunities</li>
              <li>Track your job applications</li>
              <li>Get insights and tips to improve your resume</li>
            </ul>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/alerts" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">
                Set Up Your First Job Alert
              </a>
            </div>
            
            <p style="font-size: 16px;">If you have any questions, feel free to reply to this email.</p>
            
            <p style="font-size: 16px;">Happy job hunting!</p>
            <p style="font-size: 16px;">The JobMatcher Team</p>
          </div>
          
          <div style="padding: 15px; background-color: #f3f4f6; text-align: center; font-size: 14px; color: #6b7280;">
            <p>© 2025 JobMatcher. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log(`Welcome email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

module.exports = {
  sendJobAlertEmail,
  sendWelcomeEmail
};