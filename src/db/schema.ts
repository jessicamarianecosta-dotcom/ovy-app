import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { startOfNextMonth } from "@/lib/billing-cycle";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  plan: text("plan").notNull().default("free"), // "free" | "pro"
  minutesUsedThisCycle: integer("minutes_used_this_cycle").notNull().default(0),
  extraMinutesBalance: integer("extra_minutes_balance").notNull().default(0),
  cycleResetAt: integer("cycle_reset_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => startOfNextMonth()),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSubscriptionStatus: text("stripe_subscription_status"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  apiKey: text("api_key").unique(),
  phone: text("phone"),
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    providerIdx: index("accounts_provider_idx").on(
      table.provider,
      table.providerAccountId
    ),
  })
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const transcriptions = sqliteTable(
  "transcriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Transcrição sem título"),
    durationSeconds: integer("duration_seconds").notNull(),
    faithfulText: text("faithful_text").notNull(),
    organizedText: text("organized_text").notNull(),
    editedText: text("edited_text"),
    activeVersion: text("active_version").notNull().default("organized"), // "faithful" | "organized"
    status: text("status").notNull().default("completed"), // "processing" | "completed" | "failed"
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdx: index("transcriptions_user_idx").on(table.userId),
  })
);

export const minuteLedger = sqliteTable(
  "minute_ledger",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    transcriptionId: text("transcription_id").references(
      () => transcriptions.id,
      { onDelete: "set null" }
    ),
    minutes: integer("minutes").notNull(),
    source: text("source").notNull(), // "plan" | "extra_pack" | "transcription_usage"
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdx: index("minute_ledger_user_idx").on(table.userId),
  })
);

// Linha única (id = "default") com os valores de minutos/preço que hoje
// ficavam fixos em src/lib/billing-cycle.ts, agora editáveis pelo painel
// admin sem precisar de deploy. A tabela é criada sob demanda (ver
// src/lib/settings.ts) em vez de depender de uma migração manual.
export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey(),
  freePlanMinutes: integer("free_plan_minutes").notNull(),
  proPlanMinutes: integer("pro_plan_minutes").notNull(),
  proPlanPriceBrl: real("pro_plan_price_brl").notNull(),
  // Price (recorrente, mensal) ativo no Stripe para o plano Pro. Nulo até a
  // primeira edição de preço pelo admin — nesse caso o checkout usa o
  // STRIPE_PRICE_ID_PRO_MONTHLY da env var como fallback.
  proPlanStripePriceId: text("pro_plan_stripe_price_id"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
