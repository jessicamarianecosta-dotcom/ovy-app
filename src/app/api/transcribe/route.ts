import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { getUserByApiKey } from "@/lib/api-key-auth";
import { transcribeAndSave } from "@/lib/transcribe-service";

export const maxDuration = 120;

// A extensão Chrome chama esse endpoint a partir de um content script (ou
// seja, como se fosse a própria página do WhatsApp Web fazendo a chamada),
// o que fica sujeito a CORS — sem esses cabeçalhos o navegador bloqueia a
// resposta com "Failed to fetch". Como a autenticação aqui é por header
// Authorization (não por cookie), liberar qualquer origem não abre brecha
// de CSRF.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init?.headers || {}) },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  // Aceita tanto a sessão do app web quanto a chave de API pessoal, usada
  // pelo app Android (compartilhar áudio) e pela extensão Chrome.
  let user = await getUserByApiKey(request);
  if (!user) {
    try {
      user = await requireUser();
    } catch {
      return json({ error: "Faça login para transcrever." }, { status: 401 });
    }
  }

  const formData = await request.formData();
  const file = formData.get("audio");
  if (!(file instanceof File)) {
    return json({ error: "Nenhum arquivo de áudio enviado." }, { status: 400 });
  }

  const clientDurationRaw = formData.get("clientDurationSeconds");
  const clientDurationSeconds =
    typeof clientDurationRaw === "string" ? Math.ceil(Number(clientDurationRaw)) : 0;

  const result = await transcribeAndSave(user, file, clientDurationSeconds);
  if (!result.ok) {
    return json({ error: result.error, code: result.code }, { status: result.status });
  }

  return json({
    id: result.id,
    faithfulText: result.faithfulText,
    organizedText: result.organizedText,
    durationSeconds: result.durationSeconds,
  });
}
