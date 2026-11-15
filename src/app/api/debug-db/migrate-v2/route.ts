import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export const dynamic = "force-dynamic";

const STATEMENTS = [
  "ALTER TABLE `users` ADD COLUMN `api_key` text",
  "CREATE UNIQUE INDEX IF NOT EXISTS `users_api_key_unique` ON `users` (`api_key`)",
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
      results.push({ sql, ok: true });
    } catch (error) {
      results.push({ sql, ok: false, error: (error as Error).message });
    }
  }

  return NextResponse.json({ results });
}
