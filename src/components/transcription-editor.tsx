"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Save, Trash2, FileDown, X, ClipboardCopy } from "lucide-react";

type Version = "faithful" | "organized";

export function TranscriptionEditor({
  transcriptionId,
  faithfulText,
  organizedText,
  editedText,
  initialVersion = "organized",
  onDiscard,
  onClose,
  readOnlyTitle,
}: {
  transcriptionId: string;
  faithfulText: string;
  organizedText: string;
  editedText?: string | null;
  initialVersion?: Version;
  /** Chamado ao clicar em "Descartar": apaga a transcrição definitivamente. */
  onDiscard?: () => void;
  /**
   * Chamado ao clicar no X: apenas fecha/oculta a caixa de resultado, sem
   * apagar nada. A transcrição já está salva no histórico desde que foi
   * criada (ver /api/transcribe), então fechar nunca perde conteúdo — o
   * usuário pode reabrir essa mesma transcrição pelo histórico depois.
   */
  onClose?: () => void;
  readOnlyTitle?: string;
}) {
  const router = useRouter();
  const [version, setVersion] = useState<Version>(initialVersion);
  const [text, setText] = useState(
    editedText ?? (initialVersion === "faithful" ? faithfulText : organizedText)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function switchVersion(next: Version) {
    setVersion(next);
    setText(next === "faithful" ? faithfulText : organizedText);
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(text);
    toast.success("Texto copiado.");
  }

  async function copySelectionToClipboard() {
    const el = textareaRef.current;
    const selected = el ? text.slice(el.selectionStart, el.selectionEnd) : "";
    if (!selected) {
      toast.error("Selecione um trecho do texto para copiar só a seleção.");
      return;
    }
    await navigator.clipboard.writeText(selected);
    toast.success("Seleção copiada.");
  }

  async function save() {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/transcriptions/${transcriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editedText: text, activeVersion: version }),
      });
      if (!response.ok) throw new Error();
      toast.success("Transcrição salva no histórico.");
      router.refresh();
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setIsSaving(false);
    }
  }

  async function discard() {
    setIsDiscarding(true);
    try {
      await fetch(`/api/transcriptions/${transcriptionId}`, { method: "DELETE" });
      toast.message("Transcrição descartada.");
      if (onDiscard) {
        onDiscard();
        router.refresh();
      } else {
        router.push("/historico");
      }
    } catch {
      toast.error("Não foi possível descartar.");
    } finally {
      setIsDiscarding(false);
    }
  }

  function exportAs(format: "pdf" | "docx") {
    window.open(`/api/transcriptions/${transcriptionId}/export?format=${format}`, "_blank");
  }

  return (
    <div className="relative rounded-2xl border border-neutral-200 bg-white p-6">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar resultado da transcrição"
          title="Fechar"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {readOnlyTitle && (
        <h2 className="mb-4 pr-10 text-lg font-semibold">{readOnlyTitle}</h2>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchVersion("organized")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            version === "organized"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          Organizada
        </button>
        <button
          type="button"
          onClick={() => switchVersion("faithful")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            version === "faithful"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          Fiel
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={14}
        className="mt-4 w-full resize-none rounded-xl border border-neutral-200 p-4 text-sm leading-relaxed outline-none focus:border-neutral-900"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyToClipboard}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          <Copy className="h-4 w-4" />
          Copiar tudo
        </button>
        <button
          type="button"
          onClick={copySelectionToClipboard}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          <ClipboardCopy className="h-4 w-4" />
          Copiar seleção
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => exportAs("pdf")}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          <FileDown className="h-4 w-4" />
          PDF
        </button>
        <button
          type="button"
          onClick={() => exportAs("docx")}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          <FileDown className="h-4 w-4" />
          Word
        </button>
        <button
          type="button"
          onClick={discard}
          disabled={isDiscarding}
          className="ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Descartar
        </button>
      </div>
    </div>
  );
}
