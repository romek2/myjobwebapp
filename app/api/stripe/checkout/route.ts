// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia", // Use your preferred API version
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to subscribe" },
        { status: 401 }
      );
    }
    
    // Get user from Supabase instead of Prisma
    const supabase = createServerSupabase();
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, email, name, stripeCustomerId')
      .eq('email', session.user.email)
      .single();
    
    if (userError || !user) {
      console.error("User not found:", userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Determine if this is a new customer or returning one
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email as string,
        name: user.name as string,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Update user with Stripe customer ID using Supabase
      const { error: updateError } = await supabase
        .from('User')
        .update({ stripeCustomerId: customerId })
        .eq('id', user.id);
        
      if (updateError) {
        console.error("Error updating customer ID:", updateError);
      }
    }
    
    
    // Create a checkout session
    const priceId = process.env.STRIPE_PRO_PRICE_ID as string;
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/profile?checkout=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/profile?checkout=cancel`,
      metadata: {
        userId: user.id,
      },
    });
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: error.message },
      { status: 500 }
    );
  }
}