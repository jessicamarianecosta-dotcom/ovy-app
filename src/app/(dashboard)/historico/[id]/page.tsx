import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/current-user";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { TranscriptionEditor } from "@/components/transcription-editor";

export default async function HistoricoDetailPage({
  params,
}: PageProps<"/historico/[id]">) {
  const { id } = await params;
  const user = await requireUser();

  const row = await db.query.transcriptions.findFirst({
    where: and(eq(transcriptions.id, id), eq(transcriptions.userId, user.id)),
  });
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <TranscriptionEditor
        transcriptionId={row.id}
        faithfulText={row.faithfulText}
        organizedText={row.organizedText}
        editedText={row.editedText}
        initialVersion={row.activeVersion as "faithful" | "organized"}
        readOnlyTitle={row.title}
      />
    </div>
  );
}
