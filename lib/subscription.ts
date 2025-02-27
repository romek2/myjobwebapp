// lib/subscription.ts
import { Session } from "next-auth";
import { prisma } from "./prisma";
import { useSession } from "next-auth/react";

/**
 * Check if a user has PRO access based on session data
 * For client-side components using useSession()
 */
export function hasProAccess(session?: Session | null): boolean {
  if (!session?.user) return false;
  
  // Emergency override in development
  if (process.env.NEXT_PUBLIC_DISABLE_PRO_RESTRICTIONS === "true") {
    return true;
  }
  
  // Check subscription status from session
  return session.user.subscriptionStatus === "PRO";
}

/**
 * Server-side function to check if a user has PRO access
 * For server components and API routes
 */
export async function hasProAccessServer(userIdOrEmail: string): Promise<boolean> {
  try {
    // Emergency override in development
    if (process.env.DISABLE_PRO_RESTRICTIONS === "true") {
      return true;
    }
    
    // Find user by ID or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userIdOrEmail },
          { email: userIdOrEmail }
        ]
      },
      select: {
        subscriptionStatus: true,
        subscriptionPeriodEnd: true,
        overrideAccess: true
      }
    });
    
    if (!user) return false;
    
    // Check for manual override
    if (user.overrideAccess) return true;
    
    // Check subscription status
    if (user.subscriptionStatus !== "PRO") return false;
    
    // Check if subscription is still valid
    if (user.subscriptionPeriodEnd && new Date() > user.subscriptionPeriodEnd) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking pro access:", error);
    return false; // Fail closed (no access) on errors
  }
}

/**
 * Hook to check if current user has PRO access
 */
export function useProAccess(): boolean {
  const { data: session } = useSession();
  return hasProAccess(session);
}