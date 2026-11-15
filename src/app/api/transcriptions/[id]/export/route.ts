import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/current-user";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { textToDocx, textToPdf } from "@/lib/export-doc";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/transcriptions/[id]/export">
) {
  const { id } = await ctx.params;
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const format = new URL(request.url).searchParams.get("format");
  if (format !== "pdf" && format !== "docx") {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  }

  const row = await db.query.transcriptions.findFirst({
    where: and(eq(transcriptions.id, id), eq(transcriptions.userId, user.id)),
  });
  if (!row) return NextResponse.json({ error: "Transcrição não encontrada." }, { status: 404 });

  const body =
    row.editedText ??
    (row.activeVersion === "faithful" ? row.faithfulText : row.organizedText);
  const filename = `${row.title.replace(/[^\w\-]+/g, "_")}.${format}`;

  if (format === "docx") {
    const buffer = await textToDocx(row.title, body);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const buffer = await textToPdf(row.title, body);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
