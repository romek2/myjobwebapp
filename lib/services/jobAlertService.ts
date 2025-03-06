// lib/services/jobAlertService.ts
import { createServerSupabase } from '../supabase';
import { JobAlert, PremiumJob } from '@/types/alert';

// ... rest of the file

export async function createJobAlert(
  userId: string,
  name: string,
  keywords: string,
  frequency: 'daily' | 'weekly' | 'realtime'
): Promise<JobAlert | null> {
  try {
    const supabase = createServerSupabase();
    
    // Check if user has PRO subscription
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_status, subscription_period_end')
      .eq('id', userId)
      .single();
    
    if (error || !user || user.subscription_status !== 'PRO') {
      console.log('User is not a PRO subscriber');
      return null;
    }
    
    // Check if subscription is still valid
    if (user.subscription_period_end && new Date() > new Date(user.subscription_period_end)) {
      console.log('PRO subscription has expired');
      return null;
    }
    
    // Create the job alert using Supabase
    const { data: alert, error: insertError } = await supabase
      .from('job_alerts')
      .insert({
        user_id: userId,
        name,
        keywords,
        frequency,
        active: true
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating job alert:', insertError);
      return null;
    }
    
    console.log(`Created job alert for user ${userId}: ${name}`);
    return {
      id: alert.id,
      userId: alert.user_id,
      name: alert.name,
      keywords: alert.keywords,
      frequency: alert.frequency,
      active: alert.active,
      createdAt: new Date(alert.created_at),
      updatedAt: new Date(alert.updated_at)
    };
  } catch (error) {
    console.error('Error creating job alert:', error);
    return null;
  }
}

// Update the other functions similarly...