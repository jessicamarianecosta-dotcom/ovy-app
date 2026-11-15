import { NextResponse } from "next/server";
import { parseBuffer } from "music-metadata";
import { requireUser } from "@/lib/current-user";
import { getUserByApiKey } from "@/lib/api-key-auth";
import { remainingMinutes, resetCycleIfNeeded, consumeMinutes } from "@/lib/minutes";
import { transcribeAudio, organizeTranscript } from "@/lib/replicate";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { MAX_TRANSCRIPTION_SECONDS } from "@/lib/billing-cycle";

export const maxDuration = 120;

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB, folga para áudio de até 4min

export async function POST(request: Request) {
  // Aceita tanto a sessão do app web quanto a chave de API pessoal, usada
  // pelo app Android (compartilhar áudio) e pela extensão Chrome.
  let user = await getUserByApiKey(request);
  if (!user) {
    try {
      user = await requireUser();
    } catch {
      return NextResponse.json({ error: "Faça login para transcrever." }, { status: 401 });
    }
  }

  const formData = await request.formData();
  const file = formData.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo de áudio enviado." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 25MB)." }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const clientDurationRaw = formData.get("clientDurationSeconds");
  const clientDurationSeconds =
    typeof clientDurationRaw === "string" ? Math.ceil(Number(clientDurationRaw)) : 0;

  let durationSeconds = 0;
  try {
    const metadata = await parseBuffer(buffer, file.type || undefined);
    durationSeconds = Math.ceil(metadata.format.duration ?? 0);
  } catch {
    // music-metadata não reconheceu o container (comum em alguns áudios do
    // WhatsApp); cai para a duração medida pelo próprio navegador abaixo.
  }

  if (!durationSeconds || durationSeconds <= 0) {
    durationSeconds = clientDurationSeconds;
  }

  if (!durationSeconds || durationSeconds <= 0) {
    return NextResponse.json(
      { error: "Não foi possível determinar a duração do áudio." },
      { status: 400 }
    );
  }
  if (durationSeconds > MAX_TRANSCRIPTION_SECONDS) {
    return NextResponse.json(
      { error: "O áudio excede o limite de 4 minutos por transcrição." },
      { status: 400 }
    );
  }

  user = await resetCycleIfNeeded(user);
  const neededMinutes = Math.ceil(durationSeconds / 60);
  if (remainingMinutes(user) < neededMinutes) {
    return NextResponse.json(
      {
        error:
          "Seus minutos acabaram neste ciclo. Faça upgrade para o plano Pro ou compre um pacote extra.",
        code: "OUT_OF_MINUTES",
      },
      { status: 402 }
    );
  }

  let faithfulText: string;
  try {
    faithfulText = await transcribeAudio(buffer, file.type || "audio/mpeg");
  } catch (error) {
    console.error("Erro na transcrição:", error);
    return NextResponse.json(
      { error: "Falha ao transcrever o áudio. Tente novamente." },
      { status: 502 }
    );
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
    userId: user.id,
    title: file.name?.replace(/\.[^.]+$/, "") || "Transcrição sem título",
    durationSeconds,
    faithfulText,
    organizedText,
    activeVersion: "organized",
    status: "completed",
  });

  await consumeMinutes(user, neededMinutes, id);

  return NextResponse.json({
    id,
    faithfulText,
    organizedText,
    durationSeconds,
  });
}
