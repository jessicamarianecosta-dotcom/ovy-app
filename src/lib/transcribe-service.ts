import "server-only";
import { parseBuffer } from "music-metadata";
import { remainingMinutes, resetCycleIfNeeded, consumeMinutes } from "@/lib/minutes";
import { transcribeAudio, organizeTranscript } from "@/lib/groq";
import { db } from "@/db";
import { transcriptions, users } from "@/db/schema";
import { MAX_TRANSCRIPTION_SECONDS } from "@/lib/billing-cycle";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB, folga para áudio de até 4min

export type TranscribeOutcome =
  | { ok: true; id: string; faithfulText: string; organizedText: string; durationSeconds: number }
  | { ok: false; error: string; status: number; code?: string };

/**
 * Transcreve um arquivo de áudio e salva no histórico do usuário. Usado
 * pelo /api/transcribe (upload normal do site, extensão e app Android) e
 * pelo /api/share-target (compartilhamento via PWA instalado) — mesma
 * lógica, só muda de onde o arquivo chega.
 */
export async function transcribeAndSave(
  user: typeof users.$inferSelect,
  file: File,
  clientDurationSeconds: number
): Promise<TranscribeOutcome> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Arquivo muito grande (máx. 25MB).", status: 413 };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let durationSeconds = 0;
  try {
    // `duration: true` é obrigatório aqui: por padrão o music-metadata para
    // de ler o Ogg na página 12 por economia, e em Ogg/Opus (formato dos
    // áudios de voz do WhatsApp) a duração só existe na ÚLTIMA página do
    // arquivo (granule position). Sem essa opção, todo áudio de voz do
    // WhatsApp com mais de ~12 páginas (ou seja, praticamente qualquer um)
    // cai com duration undefined — é isso que fazia o compartilhamento
    // direto (sem navegador no meio, só o PWA share-target) falhar com
    // "não foi possível determinar a duração do áudio".
    const metadata = await parseBuffer(buffer, file.type || undefined, { duration: true });
    durationSeconds = Math.ceil(metadata.format.duration ?? 0);
  } catch {
    // music-metadata não reconheceu o container (comum em alguns áudios do
    // WhatsApp); cai para a duração medida pelo próprio navegador abaixo.
  }

  if (!durationSeconds || durationSeconds <= 0) {
    durationSeconds = clientDurationSeconds;
  }
  if (!durationSeconds || durationSeconds <= 0) {
    return { ok: false, error: "Não foi possível determinar a duração do áudio.", status: 400 };
  }
  if (durationSeconds > MAX_TRANSCRIPTION_SECONDS) {
    const maxMinutes = Math.floor(MAX_TRANSCRIPTION_SECONDS / 60);
    return {
      ok: false,
      error: `O áudio excede o limite de ${maxMinutes} minutos por transcrição.`,
      status: 400,
    };
  }

  const freshUser = await resetCycleIfNeeded(user);
  const neededMinutes = Math.ceil(durationSeconds / 60);
  if ((await remainingMinutes(freshUser)) < neededMinutes) {
    return {
      ok: false,
      error: "Seus minutos acabaram neste ciclo. Faça upgrade para o plano Pro ou compre um pacote extra.",
      status: 402,
      code: "OUT_OF_MINUTES",
    };
  }

  let faithfulText: string;
  try {
    faithfulText = await transcribeAudio(buffer, file.type || "audio/mpeg");
  } catch (error) {
    console.error("Erro na transcrição:", error);
    const transcriptionError = error as Error & { response?: { status?: number } };
    if (transcriptionError.response?.status === 402 || transcriptionError.response?.status === 429) {
      return {
        ok: false,
        error: "O motor de transcrição está indisponível no momento (limite ou crédito). Tente novamente em alguns minutos.",
        status: 502,
      };
    }
    return { ok: false, error: "Falha ao transcrever o áudio. Tente novamente.", status: 502 };
  }

  let organizedText: string;
  try {
    organizedText = await organizeTranscript(faithfulText);
  } catch (error) {
    console.error("Erro ao organizar texto:", error);
    organizedText = faithfulText;
  }

  const id = crypto.randomUUID();
  await db.insert(transcriptions).values({
    id,
    userId: freshUser.id,
    title: file.name?.replace(/\.[^.]+$/, "") || "Transcrição sem título",
    durationSeconds,
    faithfulText,
    organizedText,
    activeVersion: "organized",
    status: "completed",
  });

  await consumeMinutes(freshUser, neededMinutes, id);

  return { ok: true, id, faithfulText, organizedText, durationSeconds };
}
