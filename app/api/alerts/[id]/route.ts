// app/api/alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';
import { hasProAccessServer } from '@/lib/subscription';

// Helper function to check if user can access this alert
async function canAccessAlert(userId: string, alertId: string) {
  try {
    const supabase = createServerSupabase();
    const { data: alert, error } = await supabase
      .from('job_alerts')
      .select('user_id')
      .eq('id', alertId)
      .single();
    
    if (error) {
      console.error('Error checking alert access:', error);
      return false;
    }
    
    return alert?.user_id === userId;
  } catch (error) {
    console.error('Error checking alert access:', error);
    return false;
  }
}
