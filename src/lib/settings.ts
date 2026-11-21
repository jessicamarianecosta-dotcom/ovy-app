import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { FREE_PLAN_MINUTES, PRO_PLAN_MINUTES, PRO_PLAN_PRICE_BRL } from "@/lib/billing-cycle";

const SETTINGS_ID = "default";

export type AppSettings = {
  freePlanMinutes: number;
  proPlanMinutes: number;
  proPlanPriceBrl: number;
  proPlanStripePriceId: string | null;
};

const DEFAULT_SETTINGS: Omit<AppSettings, "proPlanStripePriceId"> = {
  freePlanMinutes: FREE_PLAN_MINUTES,
  proPlanMinutes: PRO_PLAN_MINUTES,
  proPlanPriceBrl: PRO_PLAN_PRICE_BRL,
};

// A tabela não existe ainda em bancos já em produção — em vez de depender de
// uma migração manual (drizzle-kit push) rodada à mão contra o Turso, ela é
// criada sob demanda aqui. CREATE TABLE IF NOT EXISTS é barato e idempotente,
// então não tem problema chamar isso em toda leitura.
async function ensureTable() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      free_plan_minutes INTEGER NOT NULL,
      pro_plan_minutes INTEGER NOT NULL,
      pro_plan_price_brl REAL NOT NULL,
      pro_plan_stripe_price_id TEXT,
      updated_at INTEGER NOT NULL
    )
  `);
}

// Cache de processo (válido só enquanto a instância serverless ficar quente)
// pra evitar bater no banco em toda chamada de remainingMinutes/consumeMinutes.
let cached: AppSettings | null = null;

export async function getSettings(): Promise<AppSettings> {
  if (cached) return cached;

  await ensureTable();
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.id, SETTINGS_ID),
  });

  if (!row) {
    const seeded: AppSettings = { ...DEFAULT_SETTINGS, proPlanStripePriceId: null };
    await db
      .insert(appSettings)
      .values({ id: SETTINGS_ID, ...seeded })
      .onConflictDoNothing();
    cached = seeded;
    return seeded;
  }

  cached = {
    freePlanMinutes: row.freePlanMinutes,
    proPlanMinutes: row.proPlanMinutes,
    proPlanPriceBrl: row.proPlanPriceBrl,
    proPlanStripePriceId: row.proPlanStripePriceId,
  };
  return cached;
}

export async function updateSettings(
  patch: Partial<AppSettings>
): Promise<AppSettings> {
  await getSettings(); // garante que a linha "default" já existe
  await db
    .update(appSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(appSettings.id, SETTINGS_ID));
  cached = null;
  return getSettings();
}
