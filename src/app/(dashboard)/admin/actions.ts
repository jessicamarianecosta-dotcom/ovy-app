"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/current-user";
import { startOfNextMonth } from "@/lib/billing-cycle";
import { getSettings, updateSettings } from "@/lib/settings";
import { getStripe, PRO_PLAN_STRIPE_PRODUCT_ID } from "@/lib/stripe";

export async function setUserPlan(userId: string, plan: "free" | "pro") {
  const admin = await requireUser();
  if (!admin.isAdmin) throw new Error("Não autorizado.");

  await db
    .update(users)
    .set({
      plan,
      // Dá um ciclo cheio de minutos já de cara pra quem está sendo
      // liberado agora, em vez de esperar a virada do mês.
      ...(plan === "pro" ? { minutesUsedThisCycle: 0, cycleResetAt: startOfNextMonth() } : {}),
    })
    .where(eq(users.id, userId));

  revalidatePath("/admin");
}

export async function updatePlanSettings(formData: FormData) {
  const admin = await requireUser();
  if (!admin.isAdmin) throw new Error("Não autorizado.");

  const freePlanMinutes = Number(formData.get("freePlanMinutes"));
  const proPlanMinutes = Number(formData.get("proPlanMinutes"));
  const proPlanPriceBrl = Number(formData.get("proPlanPriceBrl"));

  if (
    !Number.isFinite(freePlanMinutes) || freePlanMinutes <= 0 ||
    !Number.isFinite(proPlanMinutes) || proPlanMinutes <= 0 ||
    !Number.isFinite(proPlanPriceBrl) || proPlanPriceBrl <= 0
  ) {
    throw new Error("Valores inválidos.");
  }

  const current = await getSettings();
  const priceChanged = Math.round(proPlanPriceBrl * 100) !== Math.round(current.proPlanPriceBrl * 100);

  let proPlanStripePriceId = current.proPlanStripePriceId;
  if (priceChanged) {
    // Prices no Stripe são imutáveis — preço novo = Price novo. Assinantes
    // já ativos ficam no Price antigo (Stripe não migra assinaturas
    // sozinho); só checkouts novos passam a usar este.
    const stripe = getStripe();
    const newPrice = await stripe.prices.create({
      product: PRO_PLAN_STRIPE_PRODUCT_ID,
      currency: "brl",
      unit_amount: Math.round(proPlanPriceBrl * 100),
      recurring: { interval: "month" },
    });
    proPlanStripePriceId = newPrice.id;
  }

  await updateSettings({
    freePlanMinutes,
    proPlanMinutes,
    proPlanPriceBrl,
    proPlanStripePriceId,
  });

  revalidatePath("/admin");
  revalidatePath("/plano");
}
