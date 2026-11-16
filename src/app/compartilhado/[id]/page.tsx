import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/current-user";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { ShareResultCard } from "@/components/share-result-card";

// Tela enxuta (sem menu/sidebar do site) que aparece logo depois de
// compartilhar um áudio pro Ovy via PWA — como um cartão de resultado, não
// o app inteiro. O texto já foi transcrito e salvo antes de chegar aqui
// (feito em /api/share-target); esta página só mostra o resultado.
export default async function CompartilhadoPage({
  params,
}: PageProps<"/compartilhado/[id]">) {
  const { id } = await params;
  const user = await requireUser();

  const row = await db.query.transcriptions.findFirst({
    where: and(eq(transcriptions.id, id), eq(transcriptions.userId, user.id)),
  });
  if (!row) notFound();

  const text = row.editedText || row.organizedText || row.faithfulText;

  return (
    <div className="flex flex-1 items-center justify-center bg-ovy-navy/5 px-4 py-10">
      <ShareResultCard transcriptionId={row.id} text={text} />
    </div>
  );
}
