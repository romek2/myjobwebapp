// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;

// For server-side operations (with full access)
export const createServerSupabase = () => {
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string;
  return createClient(supabaseUrl, supabaseKey);
};

// For client-side operations (with restricted access)
export const createClientSupabase = () => {
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  return createClient(supabaseUrl, supabaseKey);
};

// Helper function to get a Supabase instance based on environment
export const getSupabase = () => {
  // Check if we're running on the server or client
  if (typeof window === 'undefined') {
    return createServerSupabase();
  } else {
    return createClientSupabase();
  }
};

export default getSupabase;