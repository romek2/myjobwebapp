// app/api/stripe/webhook/route.ts
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature") as string;

    console.log("Webhook received!");
    console.log("Signature:", signature ? "Present" : "Missing");
    console.log("Secret:", webhookSecret ? "Present" : "Missing");

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.customer || !session.subscription) return;
  
  // Redundant safety: make sure we can find the user
  let userId: string | undefined;
  
  // First try from metadata
  if (session.metadata?.userId) {
    userId = session.metadata.userId;
  } 
  // Fallback: look up by customer ID
  else {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: session.customer as string },
    });
    userId = user?.id;
  }
  
  if (!userId) {
    console.error("Could not find user for checkout session");
    return;
  }
  
  // Fetch the subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );
  
  // Update user with subscription details
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      subscriptionStatus: "PRO",
      subscriptionPeriodStart: new Date(subscription.current_period_start * 1000),
      subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: subscription.customer as string },
  });
  
  if (!user) return;
  
  // Update subscription details
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripePriceId: subscription.items.data[0].price.id,
      subscriptionStatus: subscription.status === "active" ? "PRO" : "FREE",
      subscriptionPeriodStart: new Date(subscription.current_period_start * 1000),
      subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: subscription.customer as string },
  });
  
  if (!user) return;
  
  // Update subscription details
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "FREE",
      // Keep the subscription ID and other details for record-keeping
    },
  });
}