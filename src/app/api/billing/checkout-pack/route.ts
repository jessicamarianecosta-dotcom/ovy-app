import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { getStripe } from "@/lib/stripe";
import { EXTRA_PACKS } from "@/lib/billing-cycle";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { packId } = await request.json().catch(() => ({ packId: null }));
  const pack = EXTRA_PACKS.find((p) => p.id === packId);
  if (!pack) return NextResponse.json({ error: "Pacote inválido." }, { status: 400 });

  const priceId = process.env[pack.envVar];
  if (!priceId) {
    return NextResponse.json({ error: "Pacote ainda não está disponível para compra." }, { status: 500 });
  }

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
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/plano?pacote=sucesso`,
    cancel_url: `${appUrl}/plano?pacote=cancelado`,
    metadata: { userId: user.id, packId: pack.id, packMinutes: String(pack.minutes) },
  });

  return NextResponse.json({ url: session.url });
}
