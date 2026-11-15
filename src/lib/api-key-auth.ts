import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function getUserByApiKey(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const apiKey = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!apiKey) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.apiKey, apiKey),
  });
  return user ?? null;
}

export function generateApiKey(): string {
  return `ovy_${crypto.randomUUID().replace(/-/g, "")}`;
}
