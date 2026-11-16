import "server-only";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

type GroqApiError = Error & { response?: { status: number; headers?: Headers } };

function groqError(message: string, status: number, headers?: Headers): GroqApiError {
  const error = new Error(message) as GroqApiError;
  error.response = { status, headers };
  return error;
}

// whisper-large-v3-turbo: o modelo mais barato da Groq (hardware próprio
// deles, não GPU alugada por segundo como no Replicate) — ~90% mais barato
// que o Whisper comunitário que usávamos antes, pelo que pesquisamos.
const WHISPER_MODEL = "whisper-large-v3-turbo";

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const extension = mimeType.split("/")[1]?.split(";")[0] || "webm";

  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(audioBuffer)], { type: mimeType }), `audio.${extension}`);
  formData.append("model", WHISPER_MODEL);
  formData.append("language", "pt");
  formData.append("response_format", "json");

  const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw groqError(`Groq transcription failed: ${response.status} ${bodyText}`, response.status, response.headers);
  }

  const data = (await response.json()) as { text?: string };
  // Texto vazio é normal para um bloco de silêncio/ruído — não é um erro,
  // então retornamos string vazia em vez de lançar (o chamador decide o que
  // fazer com isso, sem mostrar "falha" ao usuário por um bloco mudo).
  return data.text?.trim() || "";
}

// A Groq aposentou o llama-3.1-8b-instant pro tier grátis/developer em
// ago/2026 — openai/gpt-oss-20b é o substituto recomendado por eles pra
// esse tipo de tarefa pequena (só limpar pontuação e repetições).
const TEXT_CLEANUP_MODEL = "openai/gpt-oss-20b";

export async function organizeTranscript(faithfulText: string): Promise<string> {
  const prompt = `Você recebe a transcrição literal de um áudio em português. Reescreva corrigindo pontuação, ortografia e removendo repetições e vícios de fala desnecessários ("é", "né", "tipo assim" repetidos), SEM alterar o sentido, SEM resumir e SEM adicionar informação nova. Devolva apenas o texto final, sem comentários.

Transcrição literal:
"""
${faithfulText}
"""

Texto organizado:`;

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_CLEANUP_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw groqError(`Groq chat completion failed: ${response.status} ${bodyText}`, response.status);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const organized = data.choices?.[0]?.message?.content?.trim();
  return organized || faithfulText;
}
