import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { startOfNextMonth } from "@/lib/billing-cycle";

export const maxDuration = 30;

async function setUserPlanBySubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const isActive = subscription.status === "active" || subscription.status === "trialing";

  await db
    .update(users)
    .set({
      plan: isActive ? "pro" : "free",
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      ...(isActive ? { minutesUsedThisCycle: 0, cycleResetAt: startOfNextMonth() } : {}),
    })
    .where(eq(users.stripeCustomerId, customerId));
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Webhook inválido:", error);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await setUserPlanBySubscription(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
