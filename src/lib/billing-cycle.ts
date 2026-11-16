export function startOfNextMonth(from: Date = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1);
}

export const FREE_PLAN_MINUTES = 30;
export const PRO_PLAN_MINUTES = 1000;
export const PRO_PLAN_PRICE_BRL = 17;
export const MAX_TRANSCRIPTION_SECONDS = 2 * 60;

export function planMinutes(plan: "free" | "pro"): number {
  return plan === "pro" ? PRO_PLAN_MINUTES : FREE_PLAN_MINUTES;
}
