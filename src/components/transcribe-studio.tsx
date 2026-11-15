"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic, Square, Upload, Loader2 } from "lucide-react";
import { TranscriptionEditor } from "@/components/transcription-editor";

type Result = {
  id: string;
  faithfulText: string;
  organizedText: string;
  durationSeconds: number;
};

export function TranscribeStudio({ minutesLeft }: { minutesLeft: number }) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `gravacao-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        void submitAudio(file);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void submitAudio(file);
  }

  async function submitAudio(file: File) {
    if (minutesLeft <= 0) {
      toast.error("Seus minutos acabaram neste ciclo. Faça upgrade no plano Pro.");
      return;
    }
    setIsProcessing(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Falha ao transcrever o áudio.");
        return;
      }
      setResult(data);
      toast.success("Transcrição concluída!");
      router.refresh();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (result) {
    return (
      <TranscriptionEditor
        transcriptionId={result.id}
        faithfulText={result.faithfulText}
        organizedText={result.organizedText}
        onDiscard={() => setResult(null)}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
      {isProcessing ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          <p className="text-sm text-neutral-500">Transcrevendo seu áudio…</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4 py-6">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex h-20 w-20 items-center justify-center rounded-full transition ${
                isRecording
                  ? "bg-red-500 text-white"
                  : "bg-neutral-900 text-white hover:bg-neutral-700"
              }`}
            >
              {isRecording ? <Square className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </button>
            <p className="text-sm text-neutral-500">
              {isRecording ? "Gravando… toque para parar" : "Toque para gravar"}
            </p>
          </div>

          <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
            <div className="h-px flex-1 bg-neutral-200" />
            ou
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
          >
            <Upload className="h-4 w-4" />
            Enviar arquivo de áudio
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={onFileSelected}
          />
          <p className="mt-4 text-xs text-neutral-400">
            Áudios de até 4 minutos por transcrição.
          </p>
        </>
      )}
    </div>
  );
}
