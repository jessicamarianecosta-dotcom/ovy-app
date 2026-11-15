import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "Nenhuma assinatura encontrada." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/plano`,
  });

  return NextResponse.json({ url: session.url });
}
