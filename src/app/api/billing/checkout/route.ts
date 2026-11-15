import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { getStripe } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const stripe = getStripe();
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO_MONTHLY, quantity: 1 }],
    success_url: `${appUrl}/plano?checkout=sucesso`,
    cancel_url: `${appUrl}/plano?checkout=cancelado`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
