// lib/subscription.ts
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { getServerSession } from 'next-auth/next';
import { authOptions } from "./auth";

/**
 * Check if a user has PRO access based on session data
 * For client-side components using useSession()
 */
export function useProAccess(): boolean {
  const { data: session } = useSession();
  
  // No session means no PRO access
  if (!session?.user) return false;
  
  // Emergency override for development
  if (process.env.NEXT_PUBLIC_DISABLE_PRO_RESTRICTIONS === "true") {
    return true;
  }
  
  // Check the user's subscription status from the session
  return session.user.subscriptionStatus === "PRO";
}

/**
 * Server-side function to check if a user has PRO access
 * Updated to use JWT session data instead of database query
 */
export async function hasProAccessServer(userId: string): Promise<boolean> {
  try {
    // Emergency override for development
    if (process.env.DISABLE_PRO_RESTRICTIONS === "true") {
      console.log("PRO restrictions disabled in dev mode");
      return true;
    }
    
    // Get the current user's session
    const session = await getServerSession(authOptions);
    
    // DEVELOPMENT OVERRIDE - FOR TESTING ONLY
    // Uncomment this line if you want to bypass subscription checks during development
    // return true;
    
    // No session means no PRO access
    if (!session?.user) {
      console.log("No user session found");
      return false;
    }
    
    // Check if this is the same user
    if (session.user.id !== userId) {
      console.log(`Session user ${session.user.id} doesn't match requested user ${userId}`);
      return false;
    }
    
    // Use the subscription status from the JWT session
    const isPro = session.user.subscriptionStatus === "PRO";
    console.log(`User has PRO status: ${isPro}`);
    
    return isPro;
  } catch (error) {
    console.error("Error checking PRO access:", error);
    return false; // Fail closed (no access) on errors
  }
}