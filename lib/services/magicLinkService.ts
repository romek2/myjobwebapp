// lib/services/magicLinkService.ts - SIMPLIFIED TYPE-SAFE VERSION
import { createServerSupabase } from '@/lib/supabase';
import crypto from 'crypto';

export interface MagicLinkData {
  token: string;
  companyEmail: string;
  jobId: string;
  applicationId: string; // Always string from database
  expiresAt: Date;
}

export class MagicLinkService {
  private supabase = createServerSupabase();

  /**
   * Generate a secure magic link token for company access
   */
  async generateMagicLink(
    companyEmail: string,
    jobId: string,
    applicationId: string | number, // Accept both types
    expirationHours: number = 168 // 7 days default
  ): Promise<string> {
    // Generate a cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    console.log(`🔗 Creating magic link for application ${applicationId}`);

    // Store token in database - Always convert to string
    const { error } = await this.supabase
      .from('company_access_tokens')
      .insert({
        token,
        company_email: companyEmail,
        job_id: jobId,
        application_id: String(applicationId), // Convert to string
        expires_at: expiresAt.toISOString(),
        metadata: {
          created_by: 'system',
          purpose: 'application_management'
        }
      });

    if (error) {
      console.error('Error creating magic link token:', error);
      throw new Error('Failed to generate access token');
    }

    console.log(`✅ Magic link created with token: ${token}`);
    return token;
  }

  /**
   * Validate and retrieve magic link data
   */
  async validateMagicLink(token: string): Promise<MagicLinkData | null> {
    console.log(`🔍 Validating magic link token: ${token}`);
    
    const { data, error } = await this.supabase
      .from('company_access_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      console.error('Invalid magic link token:', error?.message);
      return null;
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now > expiresAt) {
      console.log('Magic link token has expired');
      return null;
    }

    console.log(`✅ Token validated for application: ${data.application_id}`);

    return {
      token: data.token,
      companyEmail: data.company_email,
      jobId: data.job_id,
      applicationId: String(data.application_id), // Ensure string
      expiresAt: expiresAt
    };
  }

  /**
   * Mark magic link as used (optional security measure)
   */
  async markTokenAsUsed(token: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('company_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    return !error;
  }

  /**
   * Generate the full magic link URL
   */
  generateMagicLinkUrl(token: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/company/application/${token}`;
  }

  /**
   * Clean up expired tokens (call this periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const { data, error } = await this.supabase
      .from('company_access_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Get application data for magic link - TYPE-SAFE VERSION
   */
  async getApplicationForMagicLink(token: string) {
    console.log(`🔍 Getting application data for token: ${token}`);
    
    const linkData = await this.validateMagicLink(token);
    if (!linkData) {
      console.log('❌ Token validation failed');
      return null;
    }

    console.log(`✅ Token valid, fetching application: ${linkData.applicationId}`);

    // Try multiple ID formats to handle type mismatches
    const applicationIdString = linkData.applicationId;
    const applicationIdNumber = parseInt(applicationIdString);

    console.log(`🔢 Trying application ID: "${applicationIdString}" (string) and ${applicationIdNumber} (number)`);

    // Method 1: Try with string ID first
    let { data: application, error } = await this.supabase
      .from('user_job_applications')
      .select(`
        *,
        user:user_id (
          name,
          email
        )
      `)
      .eq('id', applicationIdString)
      .single();

    // Method 2: If string failed and we have valid number, try numeric
    if (error && !isNaN(applicationIdNumber)) {
      console.log('🔄 String ID failed, trying numeric ID...');
      
      const numericResult = await this.supabase
        .from('user_job_applications')
        .select(`
          *,
          user:user_id (
            name,
            email
          )
        `)
        .eq('id', applicationIdNumber)
        .single();
      
      if (!numericResult.error && numericResult.data) {
        console.log('✅ Success with numeric ID');
        application = numericResult.data;
        error = null;
      }
    }

    // Method 3: If both failed, try a broader search for debugging
    if (error && !application) {
      console.log('🔄 Both IDs failed, trying debug search...');
      
      const debugResult = await this.supabase
        .from('user_job_applications')
        .select('id, job_title, company')
        .limit(5);
      
      console.log('📊 Sample application IDs in database:', 
        debugResult.data?.map(app => ({ id: app.id, type: typeof app.id }))
      );
    }

    if (error || !application) {
      console.error('❌ Failed to fetch application:', {
        error: error?.message,
        triedString: applicationIdString,
        triedNumber: applicationIdNumber,
        numberValid: !isNaN(applicationIdNumber)
      });
      return null;
    }

    console.log(`✅ Application found: ${application.job_title} at ${application.company}`);
    
    return this.fetchJobAndReturnData(application, linkData);
  }

  /**
   * Helper method to fetch job data and return complete response
   */
  private async fetchJobAndReturnData(application: any, linkData: MagicLinkData) {
    // Get job details if needed
    let job = null;
    if (linkData.jobId && linkData.jobId !== 'test-job-for-company-response') {
      const { data: jobData } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('id', linkData.jobId)
        .single();
      
      job = jobData;
    } else {
      // For test jobs, create mock job data from application
      job = {
        id: linkData.jobId,
        title: application.job_title,
        company: application.company,
        location: 'Remote', // Default for test jobs
        description: `Test job posting for ${application.job_title}`
      };
    }

    const result = {
      application,
      job,
      linkData
    };

    console.log(`✅ Complete data package prepared:`, {
      hasApplication: !!result.application,
      hasJob: !!result.job,
      hasLinkData: !!result.linkData,
      applicationCompany: result.application?.company,
      jobTitle: result.application?.job_title
    });

    return result;
  }
}

// Export singleton instance
export const magicLinkService = new MagicLinkService();