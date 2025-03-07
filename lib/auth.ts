// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createServerSupabase } from "./supabase"
import { SupabaseClient } from "@supabase/supabase-js"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      subscriptionStatus?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    subscriptionStatus?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt" // Use JWT for sessions
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        
        // Fetch the user from Supabase to get the latest subscription status
        try {
          const supabase = createServerSupabase();
          const { data: dbUser } = await supabase
            .from('User')
            .select('subscriptionStatus')
            .eq('id', session.user.id)
            .single();
            
          if (dbUser) {
            session.user.subscriptionStatus = dbUser.subscriptionStatus;
          }
        } catch (error) {
          console.error('Error fetching subscription status:', error);
        }
      }
      return session
    },
    
    async signIn({ user, account, profile }) {
      // This is where we ensure the IDs stay synchronized
      try {
        if (!user.email) return true; // Can't match without email
        
        const supabase = createServerSupabase();
        
        // First check if this user already exists in Supabase by email
        const { data: existingUser, error: lookupError } = await supabase
          .from('User')
          .select('id, email')
          .eq('email', user.email)
          .single();
          
        if (lookupError || !existingUser) {
          // User doesn't exist in Supabase, create a new one with the NextAuth ID
          console.log(`Creating new Supabase user with ID ${user.id} for ${user.email}`);
          
          const { error: createError } = await supabase
            .from('User')
            .insert({
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              subscriptionStatus: 'FREE' // Default status
            });
            
          if (createError) {
            console.error("Failed to create user in Supabase:", createError);
            // Continue anyway to allow login
          }
        } else if (existingUser.id !== user.id) {
          // User exists but with a different ID - update it to match NextAuth
          console.log(`Updating Supabase user ID from ${existingUser.id} to ${user.id} for ${user.email}`);
          
          // First update any related records (like JobAlert) to use the new ID
          await updateRelatedRecords(supabase, existingUser.id, user.id);
          
          // Then update the user ID itself
          const { error: updateError } = await supabase
            .from('User')
            .update({ id: user.id })
            .eq('id', existingUser.id);
            
          if (updateError) {
            console.error("Failed to update user ID in Supabase:", updateError);
            // Continue anyway to allow login
          }
        }
        
        return true; // Allow sign-in
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return true; // Still allow sign-in even if synchronization fails
      }
    }
  }
}


// Helper function to update related records when changing a user's ID
async function updateRelatedRecords(
  supabase: SupabaseClient, 
  oldId: string, 
  newId: string
): Promise<void> {
  try {
    // Update JobAlert records
    const { error: alertError } = await supabase
      .from('JobAlert')
      .update({ userId: newId })
      .eq('userId', oldId);
      
    if (alertError) {
      console.error("Error updating JobAlert records:", alertError);
    }
    
    // Add other related tables here as needed
  } catch (error) {
    console.error("Error updating related records:", error);
  }
}