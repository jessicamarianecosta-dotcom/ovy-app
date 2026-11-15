"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "ovy_install_banner_dismissed";

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(true);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) return null;

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setShowIosHint((value) => !value);
  }

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="relative border-b border-ovy-navy/10 bg-ovy-navy px-4 py-2.5 text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <p className="text-xs font-medium sm:text-sm">
          Instale o Ovy no seu celular para acesso rápido
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ovy-navy hover:bg-white/90"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar app
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fechar"
            className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {showIosHint && (
        <div className="mx-auto mt-2 max-w-5xl rounded-lg bg-white/10 p-2 text-xs">
          No iPhone: toque em compartilhar <span aria-hidden>⎋</span> e depois em &quot;Adicionar à
          Tela de Início&quot;.
        </div>
      )}
    </div>
  );
}
