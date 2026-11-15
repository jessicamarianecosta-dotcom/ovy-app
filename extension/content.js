(() => {
  if (window.__ovyInjected) return;
  window.__ovyInjected = true;

  const API_BASE = "https://ovy-app.vercel.app";
  const PROCESSED_ATTR = "data-ovy-processed";
  const PLAY_LABEL_RE = /reproduzir (mensagem|recado) de voz|play voice message/i;
  const PAUSE_LABEL_RE = /pausar (mensagem|recado) de voz|pause voice message/i;

  const style = document.createElement("style");
  style.textContent = `
    .ovy-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      margin-left: 6px;
      border-radius: 999px;
      background: #111B36;
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 13px;
      vertical-align: middle;
      flex-shrink: 0;
      z-index: 2;
    }
    .ovy-btn:hover { background: #1b2a52; }
    .ovy-btn.ovy-loading { background: #8B5CF6; cursor: wait; }
    .ovy-btn.ovy-done { background: #16a34a; }
    .ovy-result {
      margin-top: 6px;
      padding: 8px 10px;
      border-radius: 10px;
      background: rgba(17,27,54,0.06);
      color: #111B36;
      font-size: 13px;
      line-height: 1.4;
      max-width: 320px;
      white-space: pre-wrap;
    }
    .ovy-result.ovy-error { color: #b91c1c; background: rgba(185,28,28,0.08); }
  `;
  document.documentElement.appendChild(style);

  // O hook em page-hook.js (mundo principal da página) avisa aqui, no
  // mundo isolado da extensão, toda vez que o WhatsApp decodifica um áudio
  // pra tocar — guardamos o bloco mais recente pra associar ao clique.
  let lastCapturedBuffer = null;
  let lastCapturedAt = 0;
  window.addEventListener("__ovyAudioBuffer", (event) => {
    lastCapturedBuffer = event.detail?.buffer || null;
    lastCapturedAt = Date.now();
  });

  function getApiKey() {
    return new Promise((resolve) => {
      if (!isExtensionContextValid()) return resolve(null);
      chrome.storage.local.get(["ovyApiKey"], (result) => resolve(result?.ovyApiKey || null));
    });
  }

  function isExtensionContextValid() {
    return Boolean(chrome?.runtime?.id);
  }

  function findPlayElement(root) {
    const matches = root.querySelectorAll("[aria-label]");
    for (const el of matches) {
      if (PLAY_LABEL_RE.test(el.getAttribute("aria-label") || "")) return el;
    }
    return null;
  }

  function findPauseElement(root) {
    const matches = root.querySelectorAll("[aria-label]");
    for (const el of matches) {
      if (PAUSE_LABEL_RE.test(el.getAttribute("aria-label") || "")) return el;
    }
    return null;
  }

  function clickElement(el) {
    if (!el) return false;
    const clickable = el.closest("button") || el;
    clickable.click();
    return true;
  }

  async function captureAudioBuffer(playButton, container) {
    lastCapturedBuffer = null;
    const before = lastCapturedAt;

    clickElement(playButton);

    // Dá tempo do WhatsApp decodificar e dispara um "pausar" assim que
    // conseguir, pra cortar o som o mais rápido possível.
    const start = Date.now();
    while (Date.now() - start < 5000) {
      if (lastCapturedAt > before && lastCapturedBuffer) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    const pauseButton = findPauseElement(container) || findPauseElement(document);
    clickElement(pauseButton);

    return lastCapturedBuffer;
  }

  async function transcribe(playButton, container, button, resultEl) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      showResult(resultEl, "Nenhuma chave de API configurada. Clique no ícone do Ovy na barra de extensões.", true);
      return;
    }

    button.classList.add("ovy-loading");
    button.textContent = "…";
    showResult(resultEl, "Transcrevendo…", false);

    try {
      const buffer = await captureAudioBuffer(playButton, container);
      if (!buffer) {
        throw new Error("Não consegui capturar o áudio desta mensagem. Tente de novo.");
      }

      const audioBlob = new Blob([buffer], { type: "audio/ogg" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "whatsapp-audio.ogg");

      const response = await fetch(`${API_BASE}/api/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Falha ao transcrever (HTTP ${response.status}).`);
      }

      const text = data.organizedText || data.faithfulText || "";
      showResult(resultEl, text || "(áudio sem fala reconhecível)", false);
      button.classList.remove("ovy-loading");
      button.classList.add("ovy-done");
      button.textContent = "✓";
    } catch (error) {
      button.classList.remove("ovy-loading");
      button.textContent = "📝";
      showResult(resultEl, error?.message || "Erro ao transcrever este áudio.", true);
    }
  }

  function showResult(resultEl, text, isError) {
    resultEl.textContent = text;
    resultEl.classList.toggle("ovy-error", Boolean(isError));
    resultEl.style.display = "block";
  }

  function attachButton(playButton) {
    if (playButton.getAttribute(PROCESSED_ATTR)) return;
    playButton.setAttribute(PROCESSED_ATTR, "1");

    // O container da mensagem é onde procuramos o botão de "pausar"
    // depois, e onde penduramos o resultado da transcrição.
    const container =
      playButton.closest("[data-id]") || playButton.closest('div[role="row"]') || playButton.parentElement;

    const button = document.createElement("button");
    button.className = "ovy-btn";
    button.type = "button";
    button.title = "Transcrever com Ovy";
    button.textContent = "📝";

    const resultEl = document.createElement("div");
    resultEl.className = "ovy-result";
    resultEl.style.display = "none";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      transcribe(playButton, container || document, button, resultEl);
    });

    const anchor = playButton.closest("button") || playButton;
    anchor.insertAdjacentElement("afterend", button);
    button.insertAdjacentElement("afterend", resultEl);
  }

  function scan() {
    document.querySelectorAll("[aria-label]").forEach((el) => {
      if (PLAY_LABEL_RE.test(el.getAttribute("aria-label") || "")) attachButton(el);
    });
  }

  scan();

  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
})();
