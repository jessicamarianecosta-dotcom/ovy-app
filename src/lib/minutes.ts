import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, minuteLedger } from "@/db/schema";
import { planMinutes, startOfNextMonth } from "@/lib/billing-cycle";
import type { InferSelectModel } from "drizzle-orm";

type User = InferSelectModel<typeof users>;

export function remainingMinutes(user: User): number {
  const planTotal = planMinutes(user.plan as "free" | "pro");
  const planRemaining = Math.max(0, planTotal - user.minutesUsedThisCycle);
  return planRemaining + user.extraMinutesBalance;
}

export async function resetCycleIfNeeded(user: User): Promise<User> {
  if (new Date() < user.cycleResetAt) return user;

  const [updated] = await db
    .update(users)
    .set({
      minutesUsedThisCycle: 0,
      cycleResetAt: startOfNextMonth(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return updated;
}

export async function consumeMinutes(
  user: User,
  minutesUsed: number,
  transcriptionId: string
) {
  const planTotal = planMinutes(user.plan as "free" | "pro");
  const planRemaining = Math.max(0, planTotal - user.minutesUsedThisCycle);
  const fromPlan = Math.min(planRemaining, minutesUsed);
  const fromExtra = minutesUsed - fromPlan;

  await db
    .update(users)
    .set({
      minutesUsedThisCycle: user.minutesUsedThisCycle + fromPlan,
      extraMinutesBalance: Math.max(0, user.extraMinutesBalance - fromExtra),
    })
    .where(eq(users.id, user.id));

  await db.insert(minuteLedger).values({
    id: crypto.randomUUID(),
    userId: user.id,
    transcriptionId,
    minutes: minutesUsed,
    source: "transcription_usage",
  });
}
