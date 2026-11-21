import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { startOfNextMonth } from "@/lib/billing-cycle";

// Endpoint temporário — só pra rodar uma vez em produção e liberar o
// plano Pro manualmente pra alguns e-mails específicos, já que ainda não
// existia uma ação de admin pra isso. Removido logo em seguida.
export async function POST(request: Request) {
  const secret = request.headers.get("x-debug-secret");
  if (!secret || secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { emails } = await request.json();
  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "emails obrigatório" }, { status: 400 });
  }

  const results = [];
  for (const email of emails) {
    const [updated] = await db
      .update(users)
      .set({ plan: "pro", minutesUsedThisCycle: 0, cycleResetAt: startOfNextMonth() })
      .where(eq(users.email, email))
      .returning();
    results.push({ email, found: Boolean(updated) });
  }

  return NextResponse.json({ results });
}
