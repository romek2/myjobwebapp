// lib/services/magicLinkService.ts
import { createServerSupabase } from '@/lib/supabase';
import crypto from 'crypto';

export interface MagicLinkData {
  token: string;
  companyEmail: string;
  jobId: string;
  applicationId: string;
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
    applicationId: string,
    expirationHours: number = 168 // 7 days default
  ): Promise<string> {
    // Generate a cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    // Store token in database
    const { error } = await this.supabase
      .from('company_access_tokens')
      .insert({
        token,
        company_email: companyEmail,
        job_id: jobId,
        application_id: applicationId,
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

    return token;
  }

  /**
   * Validate and retrieve magic link data
   */
  async validateMagicLink(token: string): Promise<MagicLinkData | null> {
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

    return {
      token: data.token,
      companyEmail: data.company_email,
      jobId: data.job_id,
      applicationId: data.application_id,
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
   * Get application data for magic link
   */
  async getApplicationForMagicLink(token: string) {
    const linkData = await this.validateMagicLink(token);
    if (!linkData) {
      return null;
    }

    // Get application with related data
    const { data: application, error } = await this.supabase
      .from('user_job_applications')
      .select(`
        *,
        user:user_id (
          name,
          email
        )
      `)
      .eq('id', linkData.applicationId)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      return null;
    }

    // Get job details
    const { data: job } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', linkData.jobId)
      .single();

    return {
      application,
      job,
      linkData
    };
  }
}

// Export singleton instance
export const magicLinkService = new MagicLinkService();