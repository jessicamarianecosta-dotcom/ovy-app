(() => {
  if (window.__ovyInjected) return;
  window.__ovyInjected = true;

  const API_BASE = "https://ovy-app.vercel.app";
  const PROCESSED_ATTR = "data-ovy-processed";

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

  function getApiKey() {
    return new Promise((resolve) => {
      if (!isExtensionContextValid()) return resolve(null);
      chrome.storage.local.get(["ovyApiKey"], (result) => resolve(result?.ovyApiKey || null));
    });
  }

  function isExtensionContextValid() {
    return Boolean(chrome?.runtime?.id);
  }

  // Acha o botão nativo de play do WhatsApp Web perto de um elemento <audio>.
  // O WhatsApp só carrega/descriptografa o áudio (e só então preenche
  // audio.src com um blob:) depois que o play é acionado — por isso
  // simulamos um clique nele antes de conseguir ler o áudio.
  function findPlayButton(audio) {
    const container = audio.closest("[data-id]") || audio.parentElement?.closest("div") || audio.parentElement;
    if (!container) return null;
    return (
      container.querySelector('button[aria-label*="ogar" i]') || // "Tocar"/"Play"
      container.querySelector('span[data-icon*="audio-play" i]')?.closest("button") ||
      container.querySelector('span[data-icon*="play" i]')?.closest("button") ||
      container.querySelector("button")
    );
  }

  async function waitForBlobSrc(audio, timeoutMs = 4000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (audio.src && audio.src.startsWith("blob:")) return true;
      await new Promise((r) => setTimeout(r, 150));
    }
    return audio.src && audio.src.startsWith("blob:");
  }

  async function ensureAudioLoaded(audio) {
    if (audio.src && audio.src.startsWith("blob:")) return true;

    const playButton = findPlayButton(audio);
    audio.muted = true;
    if (playButton) playButton.click();

    const loaded = await waitForBlobSrc(audio);

    try {
      audio.pause();
    } catch {
      // já pausado ou nem chegou a tocar; tudo bem.
    }
    audio.currentTime = 0;
    audio.muted = false;

    return loaded;
  }

  async function transcribe(audio, button, resultEl) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      showResult(resultEl, "Nenhuma chave de API configurada. Clique no ícone do Ovy na barra de extensões.", true);
      return;
    }

    button.classList.add("ovy-loading");
    button.textContent = "…";
    showResult(resultEl, "Transcrevendo…", false);

    try {
      const loaded = await ensureAudioLoaded(audio);
      if (!loaded) {
        throw new Error("Não consegui carregar o áudio desta mensagem. Toque o play uma vez e tente de novo.");
      }

      const audioBlob = await fetch(audio.src).then((r) => r.blob());
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

  function attachButton(audio) {
    if (audio.getAttribute(PROCESSED_ATTR)) return;
    audio.setAttribute(PROCESSED_ATTR, "1");

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
      transcribe(audio, button, resultEl);
    });

    // Insere o botão logo depois do player de áudio, e o resultado logo
    // abaixo da mensagem — sem mexer em mais nada do layout do WhatsApp.
    audio.insertAdjacentElement("afterend", button);
    button.insertAdjacentElement("afterend", resultEl);
  }

  function scan() {
    document.querySelectorAll("audio").forEach(attachButton);
  }

  scan();

  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
})();
