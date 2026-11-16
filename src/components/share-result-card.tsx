"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy } from "lucide-react";

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
    <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="flex items-center gap-2 bg-ovy-navy px-6 py-4">
        <Image src="/brand/ovy-logo.png" alt="Ovy" width={1181} height={1181} className="h-7 w-7" />
        <span className="text-sm font-medium text-white/90">Ovy</span>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          Transcrição pronta
        </div>

        <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-ovy-navy/10 bg-ovy-navy/[0.04] p-4">
          <p className="whitespace-pre-wrap text-[17px] leading-relaxed text-ovy-navy">
            {text || "(áudio sem fala reconhecível)"}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ovy-navy px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            <Copy className="h-4 w-4" />
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
    </div>
  );
}
