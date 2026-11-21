import "server-only";
import Stripe from "stripe";

// Produto "Ovy Pro" no Stripe (criado uma única vez). Preços novos são
// gerados sob esse produto quando o admin edita o valor da assinatura em
// /admin — Prices no Stripe são imutáveis, então mudar o preço = criar um
// Price novo, nunca editar o antigo (assinantes já ativos continuam no
// Price que tinham quando assinaram).
export const PRO_PLAN_STRIPE_PRODUCT_ID = "prod_VfddKsErgo6dns";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-10-28.endive",
    });
  }
  return _stripe;
}
