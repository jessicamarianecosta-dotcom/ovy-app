import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export const dynamic = "force-dynamic";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS \`users\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text,
	\`email\` text NOT NULL,
	\`email_verified\` integer,
	\`image\` text,
	\`plan\` text DEFAULT 'free' NOT NULL,
	\`minutes_used_this_cycle\` integer DEFAULT 0 NOT NULL,
	\`extra_minutes_balance\` integer DEFAULT 0 NOT NULL,
	\`cycle_reset_at\` integer NOT NULL,
	\`stripe_customer_id\` text,
	\`stripe_subscription_id\` text,
	\`stripe_subscription_status\` text,
	\`is_admin\` integer DEFAULT false NOT NULL,
	\`created_at\` integer NOT NULL
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS \`users_email_unique\` ON \`users\` (\`email\`)`,
  `CREATE TABLE IF NOT EXISTS \`accounts\` (
	\`user_id\` text NOT NULL,
	\`type\` text NOT NULL,
	\`provider\` text NOT NULL,
	\`provider_account_id\` text NOT NULL,
	\`refresh_token\` text,
	\`access_token\` text,
	\`expires_at\` integer,
	\`token_type\` text,
	\`scope\` text,
	\`id_token\` text,
	\`session_state\` text,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
)`,
  `CREATE INDEX IF NOT EXISTS \`accounts_provider_idx\` ON \`accounts\` (\`provider\`,\`provider_account_id\`)`,
  `CREATE TABLE IF NOT EXISTS \`sessions\` (
	\`session_token\` text PRIMARY KEY NOT NULL,
	\`user_id\` text NOT NULL,
	\`expires\` integer NOT NULL,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
)`,
  `CREATE TABLE IF NOT EXISTS \`transcriptions\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`user_id\` text NOT NULL,
	\`title\` text DEFAULT 'Transcrição sem título' NOT NULL,
	\`duration_seconds\` integer NOT NULL,
	\`faithful_text\` text NOT NULL,
	\`organized_text\` text NOT NULL,
	\`edited_text\` text,
	\`active_version\` text DEFAULT 'organized' NOT NULL,
	\`status\` text DEFAULT 'completed' NOT NULL,
	\`created_at\` integer NOT NULL,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
)`,
  `CREATE INDEX IF NOT EXISTS \`transcriptions_user_idx\` ON \`transcriptions\` (\`user_id\`)`,
  `CREATE TABLE IF NOT EXISTS \`minute_ledger\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`user_id\` text NOT NULL,
	\`transcription_id\` text,
	\`minutes\` integer NOT NULL,
	\`source\` text NOT NULL,
	\`created_at\` integer NOT NULL,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`transcription_id\`) REFERENCES \`transcriptions\`(\`id\`) ON UPDATE no action ON DELETE set null
)`,
  `CREATE INDEX IF NOT EXISTS \`minute_ledger_user_idx\` ON \`minute_ledger\` (\`user_id\`)`,
  `CREATE TABLE IF NOT EXISTS \`verification_tokens\` (
	\`identifier\` text NOT NULL,
	\`token\` text NOT NULL,
	\`expires\` integer NOT NULL
)`,
];

export async function GET() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of STATEMENTS) {
    try {
      await client.execute(sql);
      results.push({ sql: sql.slice(0, 60), ok: true });
    } catch (error) {
      results.push({
        sql: sql.slice(0, 60),
        ok: false,
        error: (error as Error).message,
      });
    }
  }

  const tables = await client.execute(
    "select name from sqlite_master where type='table'"
  );

  return NextResponse.json({
    results,
    tablesNow: tables.rows.map((r) => r.name),
  });
}
