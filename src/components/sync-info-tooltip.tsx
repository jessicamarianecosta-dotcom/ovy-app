"use client";

import { useState } from "react";
import { Info } from "lucide-react";

export function SyncInfoTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="O que é o histórico sincronizado?"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        className="flex h-4 w-4 items-center justify-center text-neutral-400 hover:text-neutral-700"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-6 z-10 w-64 -translate-x-1/2 rounded-xl border border-neutral-200 bg-white p-3 text-xs leading-relaxed text-neutral-600 shadow-lg"
        >
          Suas transcrições salvas ficam disponíveis em todos os seus
          dispositivos. Basta entrar na mesma conta para acessar seu
          histórico.
        </span>
      )}
    </span>
  );
}
