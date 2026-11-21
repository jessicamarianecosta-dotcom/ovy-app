import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { requireUser } from "@/lib/current-user";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { SyncInfoTooltip } from "@/components/sync-info-tooltip";

export default async function HistoricoPage() {
  const user = await requireUser();
  const rows = await db.query.transcriptions.findMany({
    where: eq(transcriptions.userId, user.id),
    orderBy: [desc(transcriptions.createdAt)],
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Histórico</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
        Histórico sincronizado entre seus dispositivos.
        <SyncInfoTooltip />
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
          Você ainda não salvou nenhuma transcrição.{" "}
          <Link href="/app" className="font-medium text-neutral-900 underline">
            Transcrever agora
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/historico/${row.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium text-neutral-900">{row.title}</p>
                  <p className="text-xs text-neutral-500">
                    {Math.ceil(row.durationSeconds / 60)} min ·{" "}
                    {formatDistanceToNow(row.createdAt, { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
