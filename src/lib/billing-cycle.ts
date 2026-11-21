export function startOfNextMonth(from: Date = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1);
}

export const FREE_PLAN_MINUTES = 30;
export const PRO_PLAN_MINUTES = 500;
export const PRO_PLAN_PRICE_BRL = 17;
export const MAX_TRANSCRIPTION_SECONDS = 2 * 60;

export function planMinutes(plan: "free" | "pro"): number {
  return plan === "pro" ? PRO_PLAN_MINUTES : FREE_PLAN_MINUTES;
}

// Pacotes avulsos de minutos (compra única, não é assinatura) — pra quem
// não quer o Pro mas de vez em quando precisa de mais que os 30 min grátis.
export type ExtraPack = {
  id: "pack_p" | "pack_m" | "pack_g";
  label: string;
  minutes: number;
  priceBRL: number;
  envVar: string;
};

export const EXTRA_PACKS: ExtraPack[] = [
  { id: "pack_p", label: "Pacote P", minutes: 150, priceBRL: 7.9, envVar: "STRIPE_PRICE_ID_PACK_P" },
  { id: "pack_m", label: "Pacote M", minutes: 400, priceBRL: 17.9, envVar: "STRIPE_PRICE_ID_PACK_M" },
  { id: "pack_g", label: "Pacote G", minutes: 1000, priceBRL: 34.9, envVar: "STRIPE_PRICE_ID_PACK_G" },
];
