"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/current-user";
import { generateApiKey } from "@/lib/api-key-auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function regenerateApiKeyAction() {
  const user = await requireUser();
  const apiKey = generateApiKey();
  await db.update(users).set({ apiKey }).where(eq(users.id, user.id));
  revalidatePath("/configuracoes");
  return apiKey;
}
