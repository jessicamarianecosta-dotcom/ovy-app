import { NextResponse } from "next/server";
import { getUserByApiKey } from "@/lib/api-key-auth";
import { transcribeAudio } from "@/lib/groq";

export const maxDuration = 30;

const MAX_CHUNK_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getUserByApiKey(request);
  if (!user) {
    return NextResponse.json({ error: "Chave de API inválida." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum áudio enviado." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ text: "" });
  }
  if (file.size > MAX_CHUNK_BYTES) {
    return NextResponse.json({ error: "Bloco de áudio muito grande." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const text = await transcribeAudio(buffer, file.type || "audio/webm");
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Erro na transcrição da extensão:", error);

    const transcriptionError = error as Error & {
      response?: { status?: number; headers?: Headers };
    };
    const status = transcriptionError.response?.status;

    if (status === 429) {
      const retryAfter = Number(transcriptionError.response?.headers?.get?.("retry-after")) || 5;
      return NextResponse.json(
        {
          error: "Limite de requisições atingido. Aguardando um pouco antes de continuar.",
          retryAfter,
        },
        { status: 429 }
      );
    }

    if (status === 422 || status === 400) {
      return NextResponse.json(
        { error: "O motor de transcrição recusou este áudio (formato inválido)." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: `Falha ao transcrever este bloco (${transcriptionError.message || "erro desconhecido"}).` },
      { status: 502 }
    );
  }
}
