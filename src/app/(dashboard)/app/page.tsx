import { getCurrentUser } from "@/lib/current-user";
import { resetCycleIfNeeded, remainingMinutes } from "@/lib/minutes";
import { TranscribeStudio } from "@/components/transcribe-studio";

export default async function AppPage() {
  const user = await getCurrentUser();
  const current = user ? await resetCycleIfNeeded(user) : null;
  const minutesLeft = current ? remainingMinutes(current) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Nova transcrição</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Você tem <strong>{minutesLeft} min</strong> disponíveis neste ciclo.
      </p>
      <div className="mt-6">
        <TranscribeStudio minutesLeft={minutesLeft} />
      </div>
    </div>
  );
}
