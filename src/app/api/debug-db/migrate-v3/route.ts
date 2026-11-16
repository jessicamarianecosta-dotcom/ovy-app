import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

// Endpoint temporário: adiciona phone e password_hash em users.
// Remover depois de rodar uma vez (não há MCP do Turso nesta sessão).
export async function GET() {
  const results: string[] = [];
  for (const statement of [
    "ALTER TABLE users ADD COLUMN phone text",
    "ALTER TABLE users ADD COLUMN password_hash text",
  ]) {
    try {
      await db.run(sql.raw(statement));
      results.push(`OK: ${statement}`);
    } catch (error) {
      results.push(`SKIP (${(error as Error).message}): ${statement}`);
    }
  }
  return NextResponse.json({ results });
}
