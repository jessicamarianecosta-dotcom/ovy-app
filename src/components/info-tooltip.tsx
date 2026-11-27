"use client";

import { Info } from "lucide-react";

/**
 * Ícone de informação com tooltip ao hover/foco, acessível via teclado e
 * leitores de tela. Usado para explicar funcionalidades (ex.: histórico
 * sincronizado) sem poluir a interface com texto fixo.
 */
export function InfoTooltip({
  text,
  className = "",
  iconClassName = "text-neutral-400 hover:text-neutral-600",
}: {
  text: string;
  className?: string;
  /** Sobrescreve a cor padrão do ícone (ex.: para fundos escuros). */
  iconClassName?: string;
}) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label="Mais informações"
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${iconClassName}`}
      >
        <Info className="h-4 w-4" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
