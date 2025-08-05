// lib/services/notificationService.ts
import sgMail from '@sendgrid/mail';
import { createServerSupabase } from '@/lib/supabase';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export class NotificationService {
  private supabase = createServerSupabase();

  async handleStatusUpdate(
    applicationId: string,
    status: string,
    companyNotes?: string,
    interviewDate?: string,
    interviewer?: string,
    location?: string
  ) {
    try {
      console.log(`📧 Processing notification for application ${applicationId}, status: ${status}`);

      // Get application details with user info
      const { data: application, error } = await this.supabase
        .from('user_job_applications')
        .select(`
          *,
          user:user_id (
            id,
            name,
            email,
            subscriptionStatus
          )
        `)
        .eq('id', applicationId)
        .single();

      if (error || !application) {
        console.error('❌ Application not found:', error?.message);
        return;
      }

      if (!application.user?.email) {
        console.error('❌ User email not found for application:', applicationId);
        return;
      }

      const user = application.user;
      const isPro = user.subscriptionStatus === 'PRO';

      console.log(`👤 Sending notification to ${user.email} (${isPro ? 'PRO' : 'FREE'} user)`);

      // Create notification record
      await this.createNotificationRecord(applicationId, status, companyNotes, interviewDate, user.id, isPro);

      // Send email notification
      await this.sendStatusUpdateEmail(application, status, companyNotes, interviewDate, interviewer, location);

      console.log('✅ Notification sent successfully');
    } catch (error) {
      console.error('💥 Error in handleStatusUpdate:', error);
      throw error;
    }
  }

  private async createNotificationRecord(
    applicationId: string,
    status: string,
    companyNotes?: string,
    interviewDate?: string,
    userId?: string,
    isPro: boolean = false
  ) {
    try {
      const notificationData = {
        application_id: applicationId,
        user_id: userId,
        type: 'status_update',
        title: this.getNotificationTitle(status),
        message: this.getNotificationMessage(status, companyNotes, interviewDate),
        is_read: false,
        requires_pro: false,
        is_blurred: !isPro && (status === 'interview' || status === 'offer' || companyNotes),
        metadata: {
          status,
          companyNotes,
          interviewDate,
          interviewer: undefined,
          location: undefined,
          timestamp: new Date().toISOString()
        }
      };

      const { error } = await this.supabase
        .from('user_notifications')
        .insert([notificationData]);

      if (error) {
        console.error('❌ Error creating notification record:', error);
      } else {
        console.log('✅ Notification record created');
      }
    } catch (error) {
      console.error('💥 Error creating notification record:', error);
    }
  }

  private async sendStatusUpdateEmail(
    application: any,
    status: string,
    companyNotes?: string,
    interviewDate?: string,
    interviewer?: string,
    location?: string
  ) {
    const user = application.user;
    const isPro = user.subscriptionStatus === 'PRO';
    
    const statusDisplayName = this.getStatusDisplayName(status);
    const statusEmoji = this.getStatusEmoji(status);
    
    const subject = `${statusEmoji} Application Update: ${application.job_title} at ${application.company}`;
    
    // Create email content
    const textContent = this.createTextEmailContent(application, status, statusDisplayName, companyNotes, interviewDate, interviewer, location, isPro);
    const htmlContent = this.createHtmlEmailContent(application, status, statusDisplayName, statusEmoji, companyNotes, interviewDate, interviewer, location, isPro);

    const msg = {
      to: user.email,
      from: process.env.SENDGRID_FROM_EMAIL as string,
      subject,
      text: textContent,
      html: htmlContent,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Status update email sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Error sending status update email:', error);
      throw error;
    }
  }

  private createTextEmailContent(
    application: any,
    status: string,
    statusDisplayName: string,
    companyNotes?: string,
    interviewDate?: string,
    interviewer?: string,
    location?: string,
    isPro: boolean = false
  ): string {
    const user = application.user;
    const userName = user.name || 'there';
    
    let content = `Hello ${userName}!

Great news! There's an update on your job application:

Job: ${application.job_title}
Company: ${application.company}
New Status: ${statusDisplayName}
Updated: ${new Date().toLocaleString()}

`;

    if (isPro) {
      if (companyNotes) {
        content += `Company Notes:
${companyNotes}

`;
      }

      if (status === 'interview' && interviewDate) {
        content += `Interview Details:
📅 Date & Time: ${new Date(interviewDate).toLocaleString()}`;
        if (interviewer) {
          content += `\n👤 Interviewer: ${interviewer}`;
        }
        if (location) {
          content += `\n📍 Location: ${location}`;
        }
        content += '\n\n';
      }
    } else {
      if (status === 'interview' || status === 'offer' || companyNotes) {
        content += `🔒 Additional details are available with PRO subscription.
Upgrade at ${process.env.NEXTAUTH_URL}/pricing to see company notes, interview details, and more.

`;
      }
    }

    content += `Track all your applications: ${process.env.NEXTAUTH_URL}/profile

Best regards,
The JobMatcher Team

---
Manage your notifications: ${process.env.NEXTAUTH_URL}/settings
Unsubscribe: ${process.env.NEXTAUTH_URL}/unsubscribe`;

    return content;
  }

  private createHtmlEmailContent(
    application: any,
    status: string,
    statusDisplayName: string,
    statusEmoji: string,
    companyNotes?: string,
    interviewDate?: string,
    interviewer?: string,
    location?: string,
    isPro: boolean = false
  ): string {
    const user = application.user;
    const userName = user.name || 'there';
    const statusColor = this.getStatusColor(status);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #4a6cf7; margin-bottom: 20px;">
            ${statusEmoji} Application Status Update
          </h2>
          
          <p>Hello <strong>${userName}</strong>!</p>
          
          <p>Great news! There's an update on your job application:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
            <h3 style="margin: 0 0 15px 0; color: #333;">${application.job_title}</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Company:</strong> ${application.company}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Location:</strong> ${application.location || 'Not specified'}</p>
            <div style="margin: 15px 0;">
              <span style="background-color: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                ${statusEmoji} ${statusDisplayName}
              </span>
            </div>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">
              <strong>Updated:</strong> ${new Date().toLocaleString()}
            </p>
          </div>

          ${isPro && companyNotes ? `
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border: 1px solid #bbdefb; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;">💬 Company Notes</h4>
              <p style="margin: 0; color: #333; line-height: 1.6;">${companyNotes}</p>
            </div>
          ` : ''}

          ${isPro && status === 'interview' && interviewDate ? `
            <div style="background-color: #f3e5f5; padding: 15px; border-radius: 8px; border: 1px solid #ce93d8; margin: 20px 0;">
              <h4 style="margin: 0 0 15px 0; color: #7b1fa2;">🗓️ Interview Details</h4>
              <div style="color: #333;">
                <p style="margin: 5px 0;"><strong>📅 Date & Time:</strong> ${new Date(interviewDate).toLocaleString()}</p>
                ${interviewer ? `<p style="margin: 5px 0;"><strong>👤 Interviewer:</strong> ${interviewer}</p>` : ''}
                ${location ? `<p style="margin: 5px 0;"><strong>📍 Location:</strong> ${location}</p>` : ''}
              </div>
            </div>
          ` : ''}

          ${!isPro && (status === 'interview' || status === 'offer' || companyNotes) ? `
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; border: 1px solid #ffcc02; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #f57c00;">🔒 Additional Details Available</h4>
              <p style="margin: 0 0 15px 0; color: #333;">
                Company notes, interview schedules, and other detailed updates are available with PRO subscription.
              </p>
              <a href="${process.env.NEXTAUTH_URL}/pricing" 
                 style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Upgrade to PRO
              </a>
            </div>
          ` : ''}

          <div style="margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/profile" 
               style="background-color: #4a6cf7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Track All Applications
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #777; font-size: 14px;">
            Best regards,<br>
            The JobMatcher Team
          </p>
          
          <p style="color: #777; font-size: 12px; margin-top: 20px;">
            <a href="${process.env.NEXTAUTH_URL}/settings" style="color: #777;">Manage notifications</a> | 
            <a href="${process.env.NEXTAUTH_URL}/unsubscribe" style="color: #777;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `;
  }

  private getNotificationTitle(status: string): string {
    switch (status) {
      case 'under_review': return 'Application Under Review';
      case 'interview': return 'Interview Scheduled!';
      case 'offer': return 'Job Offer Received!';
      case 'hired': return 'Congratulations! You\'re Hired!';
      case 'rejected': return 'Application Update';
      case 'withdrawn': return 'Application Withdrawn';
      default: return 'Application Status Update';
    }
  }

  private getNotificationMessage(status: string, companyNotes?: string, interviewDate?: string): string {
    let baseMessage = '';
    
    switch (status) {
      case 'under_review':
        baseMessage = 'Your application is now being reviewed by the hiring team.';
        break;
      case 'interview':
        baseMessage = interviewDate 
          ? `Interview scheduled for ${new Date(interviewDate).toLocaleString()}`
          : 'An interview has been scheduled for your application.';
        break;
      case 'offer':
        baseMessage = 'Congratulations! You\'ve received a job offer.';
        break;
      case 'hired':
        baseMessage = 'Congratulations! You\'ve been hired for this position.';
        break;
      case 'rejected':
        baseMessage = 'Thank you for your interest. The company has decided to move forward with other candidates.';
        break;
      case 'withdrawn':
        baseMessage = 'Your application has been withdrawn.';
        break;
      default:
        baseMessage = 'Your application status has been updated.';
    }

    if (companyNotes) {
      baseMessage += ` Additional notes: ${companyNotes.substring(0, 100)}${companyNotes.length > 100 ? '...' : ''}`;
    }

    return baseMessage;
  }

  private getStatusDisplayName(status: string): string {
    switch (status) {
      case 'applied': return 'Applied';
      case 'under_review': return 'Under Review';
      case 'interview': return 'Interview Scheduled';
      case 'offer': return 'Offer Received';
      case 'hired': return 'Hired';
      case 'rejected': return 'Not Selected';
      case 'withdrawn': return 'Withdrawn';
      default: return status.replace('_', ' ').toUpperCase();
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'applied': return '📝';
      case 'under_review': return '👀';
      case 'interview': return '🗓️';
      case 'offer': return '🎉';
      case 'hired': return '🎊';
      case 'rejected': return '📋';
      case 'withdrawn': return '↩️';
      default: return '📬';
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'applied': return '#2196f3';
      case 'under_review': return '#ff9800';
      case 'interview': return '#9c27b0';
      case 'offer': return '#4caf50';
      case 'hired': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'withdrawn': return '#757575';
      default: return '#2196f3';
    }
  }
}

export const notificationService = new NotificationService();