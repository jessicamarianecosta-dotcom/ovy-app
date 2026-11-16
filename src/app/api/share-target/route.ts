import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { transcribeAndSave } from "@/lib/transcribe-service";

export const maxDuration = 120;

// Alvo do "share_target" do manifest do PWA: quando o Ovy está instalado
// (Chrome/Android), ele aparece na própria tela de compartilhar do sistema
// (ex: WhatsApp → ⋮ → Compartilhar → Ovy), sem app nativo nenhum. O Android
// chama essa URL como uma navegação normal (POST), não como fetch — por
// isso a resposta é sempre um redirecionamento de página, nunca JSON.
export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    // Sem sessão: manda pro login. O arquivo compartilhado se perde nesse
    // caso (não dá pra retomar o compartilhamento depois do login), mas é
    // melhor que travar numa tela em branco.
    return NextResponse.redirect(new URL("/entrar", request.url), 303);
  }

  const formData = await request.formData();
  const file = formData.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.redirect(new URL("/app?erro=sem-audio", request.url), 303);
  }

  const result = await transcribeAndSave(user, file, 0);
  if (!result.ok) {
    const url = new URL("/app", request.url);
    url.searchParams.set("erro", result.error);
    return NextResponse.redirect(url, 303);
  }

  return NextResponse.redirect(new URL(`/historico/${result.id}`, request.url), 303);
}
