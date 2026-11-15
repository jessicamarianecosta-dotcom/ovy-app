import "server-only";
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// vaibhavs10/incredibly-fast-whisper: GPU-segundo, escala a zero, custo muito baixo por minuto de áudio.
// Sem hash de versão fixado: usa sempre a última versão publicada do modelo
// (um hash fixo errado ou desatualizado causa erro 422 "Invalid version").
const WHISPER_MODEL = "vaibhavs10/incredibly-fast-whisper";

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string) {
  const extension = mimeType.split("/")[1]?.split(";")[0] || "webm";
  const file = new File([new Uint8Array(audioBuffer)], `audio-${Date.now()}.${extension}`, {
    type: mimeType,
  });
  const uploaded = await replicate.files.create(file);
  const audioUrl = uploaded.urls.get;

  try {
    const output = (await replicate.run(WHISPER_MODEL, {
      input: {
        audio: audioUrl,
        task: "transcribe",
        language: "portuguese",
        batch_size: 24,
      },
    })) as { text?: string; segments?: unknown[] };

    // Texto vazio é normal para um bloco de silêncio/ruído — não é um erro,
    // então retornamos string vazia em vez de lançar (o chamador decide o
    // que fazer com isso, sem mostrar "falha" ao usuário por um bloco mudo).
    return output?.text?.trim() || "";
  } finally {
    await replicate.files.delete(uploaded.id).catch(() => {});
  }
}

// Modelo de texto pequeno/barato só para limpar pontuação e repetições (versão "organizada").
const TEXT_CLEANUP_MODEL = "meta/meta-llama-3-8b-instruct";

export async function organizeTranscript(faithfulText: string) {
  const prompt = `Você recebe a transcrição literal de um áudio em português. Reescreva corrigindo pontuação, ortografia e removendo repetições e vícios de fala desnecessários ("é", "né", "tipo assim" repetidos), SEM alterar o sentido, SEM resumir e SEM adicionar informação nova. Devolva apenas o texto final, sem comentários.

Transcrição literal:
"""
${faithfulText}
"""

Texto organizado:`;

  const output = await replicate.run(TEXT_CLEANUP_MODEL, {
    input: {
      prompt,
      max_tokens: 2048,
      temperature: 0.2,
    },
  });

  const organized = Array.isArray(output) ? output.join("") : String(output);
  return organized.trim() || faithfulText;
}
