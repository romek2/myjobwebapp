// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createServerSupabase } from "./supabase"

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
    // Add other providers as needed
  ],
  session: {
    strategy: "jwt" // Use JWT for sessions
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // When a user signs in, we get the user object. Add the user ID to the token.
      if (user) {
        token.id = user.id
      }
      return token
    },
    
    async session({ session, token }) {
      if (session.user) {
        // Add the ID from the token to the session
        session.user.id = token.id as string
        
        // Fetch subscription status from Supabase
        if (session.user.email) {
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
            console.error('Error fetching user subscription status:', error);
          }
        }
      }
      return session
    },
    
    async signIn({ user, account, profile }) {
      try {
        // Get Supabase client
        const supabase = createServerSupabase();
        
        // Check if user exists in Supabase by email
        if (user.email) {
          const { data: existingUser, error: lookupError } = await supabase
            .from('User')
            .select('id, email')
            .eq('email', user.email)
            .single();
          
          if (lookupError || !existingUser) {
            // User doesn't exist, create new user with NextAuth ID
            console.log(`Creating new user with ID ${user.id} and email ${user.email}`);
            const { error: createError } = await supabase
              .from('User')
              .insert({
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                subscriptionStatus: 'FREE'
              });
              
            if (createError) {
              console.error('Error creating user in Supabase:', createError);
              return false;
            }
          } else {
            // User exists but IDs might not match
            if (existingUser.id !== user.id) {
              console.log(`Updating user ID from ${existingUser.id} to ${user.id} for email ${user.email}`);
              // Update the ID to match NextAuth
              const { error: updateError } = await supabase
                .from('User')
                .update({ id: user.id })
                .eq('id', existingUser.id);
                
              if (updateError) {
                console.error('Error updating user ID in Supabase:', updateError);
                // Don't fail the sign-in, but log the error
              }
            }
          }
        }
        
        return true; // Allow sign-in
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false; // Fail sign-in if there's an error
      }
    }
  }
}