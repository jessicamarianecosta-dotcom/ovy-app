import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/current-user";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const rows = await db.query.transcriptions.findMany({
    where: eq(transcriptions.userId, user.id),
    orderBy: [desc(transcriptions.createdAt)],
  });

  return NextResponse.json(rows);
}
