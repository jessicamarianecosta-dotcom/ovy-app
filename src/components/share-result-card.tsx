"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ShareResultCard({
  transcriptionId,
  text,
}: {
  transcriptionId: string;
  text: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Texto copiado.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não consegui copiar. Selecione o texto manualmente.");
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <h1 className="text-lg font-semibold text-ovy-navy">Ovy</h1>
      <p className="mt-3 text-sm text-neutral-500">Transcrição pronta:</p>
      <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-[15px] text-ovy-navy">
        {text || "(áudio sem fala reconhecível)"}
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full rounded-full bg-ovy-navy px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          {copied ? "Copiado!" : "Copiar texto"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/historico/${transcriptionId}`)}
          className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium text-ovy-navy hover:bg-neutral-50"
        >
          Abrir no Ovy
        </button>
        <button
          type="button"
          onClick={() => {
            // Volta pro app que chamou o compartilhamento (o WhatsApp),
            // em vez de navegar pra outra tela dentro do próprio Ovy.
            // window.close() funciona em alguns navegadores quando essa é
            // a única página da aba; o fallback cobre o resto dos casos.
            window.close();
            window.history.back();
          }}
          className="w-full rounded-full px-4 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
