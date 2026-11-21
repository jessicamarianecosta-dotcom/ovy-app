import { getCurrentUser } from "@/lib/current-user";
import { resetCycleIfNeeded, remainingMinutes } from "@/lib/minutes";
import { TranscribeStudio } from "@/components/transcribe-studio";

export default async function AppPage({ searchParams }: PageProps<"/app">) {
  const user = await getCurrentUser();
  const current = user ? await resetCycleIfNeeded(user) : null;
  const minutesLeft = current ? await remainingMinutes(current) : 0;
  const params = await searchParams;
  const erro = typeof params.erro === "string" ? params.erro : null;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Nova transcrição</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Você tem <strong>{minutesLeft} min</strong> disponíveis neste ciclo.
      </p>
      {erro && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro === "sem-audio" ? "Não recebi nenhum áudio compartilhado." : erro}
        </div>
      )}
      <div className="mt-6">
        <TranscribeStudio minutesLeft={minutesLeft} />
      </div>
    </div>
  );
}
