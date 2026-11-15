"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import { regenerateApiKeyAction } from "@/app/(dashboard)/configuracoes/actions";

export function ApiKeyCard({ initialApiKey }: { initialApiKey: string | null }) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [visible, setVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  function regenerate() {
    startTransition(async () => {
      const key = await regenerateApiKeyAction();
      setApiKey(key);
      setVisible(true);
      toast.success("Nova chave gerada. Copie e cole na extensão do Ovy.");
    });
  }

  async function copy() {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    toast.success("Chave copiada.");
  }

  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="font-semibold text-neutral-900">Chave de API</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Use essa chave para conectar a extensão do Ovy no navegador.
      </p>

      {apiKey ? (
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
            {visible ? apiKey : "•".repeat(24)}
          </code>
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="rounded-lg border border-neutral-300 p-2 hover:bg-neutral-50"
            aria-label={visible ? "Esconder chave" : "Mostrar chave"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={copy}
            className="rounded-lg border border-neutral-300 p-2 hover:bg-neutral-50"
            aria-label="Copiar chave"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-400">Nenhuma chave gerada ainda.</p>
      )}

      <button
        type="button"
        onClick={regenerate}
        disabled={isPending}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
      >
        <RefreshCw className="h-4 w-4" />
        {apiKey ? "Gerar nova chave" : "Gerar chave"}
      </button>
      {apiKey && (
        <p className="mt-2 text-xs text-neutral-400">
          Gerar uma nova chave invalida a anterior — você precisará atualizar a extensão.
        </p>
      )}
    </div>
  );
}
