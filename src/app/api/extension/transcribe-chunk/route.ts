import { NextResponse } from "next/server";
import { getUserByApiKey } from "@/lib/api-key-auth";
import { transcribeAudio } from "@/lib/replicate";

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
    return NextResponse.json({ error: "Falha ao transcrever este bloco." }, { status: 502 });
  }
}
