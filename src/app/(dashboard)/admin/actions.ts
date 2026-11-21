"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/current-user";
import { startOfNextMonth } from "@/lib/billing-cycle";

export async function setUserPlan(userId: string, plan: "free" | "pro") {
  const admin = await requireUser();
  if (!admin.isAdmin) throw new Error("Não autorizado.");

  await db
    .update(users)
    .set({
      plan,
      // Dá um ciclo cheio de minutos já de cara pra quem está sendo
      // liberado agora, em vez de esperar a virada do mês.
      ...(plan === "pro" ? { minutesUsedThisCycle: 0, cycleResetAt: startOfNextMonth() } : {}),
    })
    .where(eq(users.id, userId));

  revalidatePath("/admin");
}
