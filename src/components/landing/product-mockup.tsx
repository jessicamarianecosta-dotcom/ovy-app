import { Mic, FileAudio, Check } from "lucide-react";

const WAVE_HEIGHTS = [40, 70, 50, 90, 60, 100, 45, 75, 55, 85, 40, 65];

export function Waveform({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-end gap-[3px] ${className}`}>
      {WAVE_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className="ovy-wave-bar w-[3px] rounded-full bg-violet-400"
          style={{
            height: `${height}%`,
            animationDelay: `${index * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ProductMockup() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_20px_60px_-15px_rgba(17,27,54,0.25)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-ovy-navy">
          <FileAudio className="h-4 w-4 text-violet-500" />
          reuniao-equipe.m4a
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600">
          2:14
        </span>
      </div>

      <div className="mt-4 flex h-16 items-center justify-center rounded-xl bg-ovy-surface">
        <Waveform className="h-10" />
      </div>

      <div className="mt-4 flex gap-2">
        <span className="rounded-full bg-ovy-navy px-3 py-1 text-xs font-medium text-white">
          Organizada
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
          Fiel
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        &ldquo;Quero conversar sobre o projeto de amanhã, pois precisamos
        organizar alguns detalhes antes da apresentação.&rdquo;
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <Check className="h-3.5 w-3.5" />
          Transcrição concluída
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-white">
          <Mic className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
