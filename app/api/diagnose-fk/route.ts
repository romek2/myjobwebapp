// app/api/diagnose-fk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initialize Supabase
    const supabase = createServerSupabase();
    
    // Get current user ID from session
    const sessionUserId = session.user.id;
    
    // 1. Check if user exists in User table with exact ID match
    const { data: exactUserMatch, error: exactMatchError } = await supabase
      .from('User')
      .select('id, email')
      .eq('id', sessionUserId)
      .single();
    
    // 2. Query User table for the current user's email
    let emailMatchUser = null;
    let emailMatchError = null;
    
    if (session.user.email) {
      const emailResult = await supabase
        .from('User')
        .select('id, email')
        .eq('email', session.user.email)
        .single();
      
      emailMatchUser = emailResult.data;
      emailMatchError = emailResult.error;
    }
    
    // 3. Check database structure
    // Run a raw query to check the constraint definition
    const { data: constraintInfo, error: constraintError } = await supabase
      .rpc('get_foreign_key_info', { constraint_name: 'JobAlert_userId_fkey' })
      .single();
    
    // 4. Try fetching some users with any id
    const { data: sampleUsers, error: sampleError } = await supabase
      .from('User')
      .select('id, email')
      .limit(3);
    
    return NextResponse.json({
      // Session information
      session: {
        userId: sessionUserId,
        email: session.user.email,
        status: session.user.subscriptionStatus
      },
      
      // User lookup results
      exactMatch: {
        found: !!exactUserMatch,
        user: exactUserMatch,
        error: exactMatchError ? exactMatchError.message : null
      },
      
      emailMatch: {
        found: !!emailMatchUser,
        user: emailMatchUser,
        error: emailMatchError ? emailMatchError.message : null
      },
      
      // Constraint information
      constraint: {
        info: constraintInfo,
        error: constraintError ? constraintError.message : null,
        note: constraintError ? "The constraint check requires a custom RPC function. If this function doesn't exist, you may see an error here." : ""
      },
      
      // Sample users for comparison
      sampleUsers: sampleUsers,
      
      // Summary of likely issue
      analysis: {
        userIdMismatch: exactUserMatch ? false : true,
        emailFoundWithDifferentId: (!exactUserMatch && emailMatchUser) ? true : false,
        possibleSolution: !exactUserMatch && emailMatchUser ? 
          `The ID in your session (${sessionUserId}) doesn't match the ID in your User table for the same email (${emailMatchUser.id}). Consider updating your auth flow to use consistent IDs.` : 
          exactUserMatch ? 
            "Your user ID exists in the User table, so there might be another issue with the constraint." :
            "Your user ID doesn't exist in the User table. Make sure the user is properly created before adding alerts."
      }
    });
  } catch (error: any) {
    console.error('Error in diagnose-fk API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred',
      message: error.message
    }, { status: 500 });
  }
}