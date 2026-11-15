import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/current-user";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";

export async function GET(_request: Request, ctx: RouteContext<"/api/transcriptions/[id]">) {
  const { id } = await ctx.params;
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const row = await db.query.transcriptions.findFirst({
    where: and(eq(transcriptions.id, id), eq(transcriptions.userId, user.id)),
  });
  if (!row) return NextResponse.json({ error: "Transcrição não encontrada." }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/transcriptions/[id]">) {
  const { id } = await ctx.params;
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json();
  const update: Partial<typeof transcriptions.$inferInsert> = {};
  if (typeof body.title === "string") update.title = body.title.slice(0, 200);
  if (typeof body.editedText === "string") update.editedText = body.editedText;
  if (body.activeVersion === "faithful" || body.activeVersion === "organized") {
    update.activeVersion = body.activeVersion;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const [row] = await db
    .update(transcriptions)
    .set(update)
    .where(and(eq(transcriptions.id, id), eq(transcriptions.userId, user.id)))
    .returning();

  if (!row) return NextResponse.json({ error: "Transcrição não encontrada." }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/transcriptions/[id]">) {
  const { id } = await ctx.params;
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await db
    .delete(transcriptions)
    .where(and(eq(transcriptions.id, id), eq(transcriptions.userId, user.id)));

  return NextResponse.json({ ok: true });
}
