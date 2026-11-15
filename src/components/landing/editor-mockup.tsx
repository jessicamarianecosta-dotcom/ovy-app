import { Copy, Save, FileDown, FileAudio } from "lucide-react";

export function EditorMockup() {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_30px_80px_-20px_rgba(17,27,54,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-ovy-navy">
          <FileAudio className="h-4 w-4 text-violet-500" />
          entrevista-podcast.mp3
        </div>
        <span className="rounded-full bg-ovy-surface px-3 py-1 text-xs font-medium text-gray-500">
          3:42 de duração
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <span className="rounded-full bg-ovy-navy px-4 py-1.5 text-sm font-medium text-white">
          Organizada
        </span>
        <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-500">
          Fiel
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-ovy-surface p-4 text-sm leading-relaxed text-gray-700">
        Hoje quero falar sobre como organizamos o processo de lançamento. A
        ideia central é simplificar cada etapa, desde a gravação da entrevista
        até a publicação do conteúdo final, sem perder a essência do que foi
        dito originalmente.
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600"
        >
          <Copy className="h-4 w-4" />
          Copiar
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white"
        >
          <Save className="h-4 w-4" />
          Salvar
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600"
        >
          <FileDown className="h-4 w-4" />
          PDF
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600"
        >
          <FileDown className="h-4 w-4" />
          Word
        </button>
      </div>
    </div>
  );
}
