"use client";

import { usePathname, useRouter } from "next/navigation";
import { Mic } from "lucide-react";

export function FloatingRecordButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/app") return null;

  return (
    <button
      type="button"
      onClick={() => router.push("/app")}
      aria-label="Nova transcrição"
      className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition hover:bg-neutral-700 sm:bottom-8 sm:right-8"
    >
      <Mic className="h-6 w-6" />
    </button>
  );
}
