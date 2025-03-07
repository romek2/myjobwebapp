// app/api/supabase-check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { userId, userEmail } = await request.json();
    
    // Initialize Supabase
    const supabase = createServerSupabase();
    
    // Find user by ID
    const { data: userById, error: idError } = await supabase
      .from('User')
      .select('id, email, subscriptionStatus')
      .eq('id', userId)
      .single();
    
    let userByEmail = null;
    let emailError = null;
    
    // If no match by ID, try by email
    if (idError && userEmail) {
      const result = await supabase
        .from('User')
        .select('id, email, subscriptionStatus')
        .eq('email', userEmail)
        .single();
      
      userByEmail = result.data;
      emailError = result.error;
    }
    
    // Get some sample users
    const { data: sampleUsers } = await supabase
      .from('User')
      .select('id, email')
      .limit(5);
    
    // Analyze the foreign key relationship
    const { data: fkInfo } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name, constraint_type')
      .eq('constraint_name', 'JobAlert_userId_fkey')
      .single();
    
    // Get the actual foreign key definition
    let fkDefinition = null;
    
    if (fkInfo) {
      // This is a raw SQL query that may or may not work depending on your Supabase setup
      const { data: definition } = await supabase.rpc(
        'run_sql_query',
        { query: `
          SELECT
            ccu.column_name AS foreign_column_name,
            ccu.table_name AS foreign_table_name
          FROM 
            information_schema.constraint_column_usage AS ccu
          JOIN 
            information_schema.table_constraints AS tc 
            ON ccu.constraint_name = tc.constraint_name
          WHERE 
            tc.constraint_name = 'JobAlert_userId_fkey'
        `}
      );
      
      if (definition) {
        fkDefinition = definition;
      }
    }
    
    // Return results
    return NextResponse.json({
      // User lookup results
      userExists: !!userById || !!userByEmail,
      foundById: !!userById,
      foundByEmail: !!userByEmail,
      dbUser: userById || userByEmail,
      
      // Sample data
      sampleUsers,
      
      // Foreign key info
      fkInfo,
      fkDefinition,
      
      // Additional context
      idError: idError ? idError.message : null,
      emailError: emailError ? emailError.message : null,
      
      // Analysis (simple)
      suggestion: !userById && userByEmail ? 
        "ID mismatch detected. The email exists but with a different ID." : 
        !userById && !userByEmail ? 
          "User not found in database. Ensure the user exists before creating alerts." :
          "User found with matching ID. If you're still having problems, check the table structure."
    });
  } catch (error: any) {
    console.error('Error in supabase-check API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred',
      message: error.message
    }, { status: 500 });
  }
}