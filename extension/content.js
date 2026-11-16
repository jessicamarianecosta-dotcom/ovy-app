(() => {
  if (window.__ovyInjected) return;
  window.__ovyInjected = true;

  const API_BASE = "https://ovy-app.vercel.app";
  const PROCESSED_ATTR = "data-ovy-processed";
  const PLAY_LABEL_RE = /reproduzir (mensagem|recado) de voz|play voice message/i;
  const PAUSE_LABEL_RE = /pausar (mensagem|recado) de voz|pause voice message/i;
  const MAX_RECORD_MS = 20000;

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
    .ovy-btn.ovy-loading { background: #8B5CF6; cursor: wait; opacity: 0.85; }
    .ovy-btn.ovy-done { background: #16a34a; }
    .ovy-btn img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      pointer-events: none;
    }
    .ovy-result {
      display: block;
      box-sizing: border-box;
      width: 280px;
      max-width: 90vw;
      margin: 6px 0 0;
      padding: 8px 10px;
      border-radius: 10px;
      background: rgba(17,27,54,0.06);
      color: #111B36;
      font-size: 13px;
      line-height: 1.4;
      white-space: normal;
      word-break: normal;
      overflow-wrap: break-word;
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

  // Grava o áudio de SAÍDA da aba (depois de qualquer descriptografia/
  // decodificação interna do WhatsApp) via tabCapture, em vez de tentar
  // espiar por dentro do código deles — mais lento, mas de verdade
  // confiável, porque não depende de adivinhar como eles tocam o áudio.
  async function captureAudioViaTabCapture(playButton, container) {
    const recordPromise = chrome.runtime.sendMessage({
      type: "RECORD_TAB_AUDIO",
      maxMs: MAX_RECORD_MS,
    });

    // Pequena espera pro gravador já estar de pé antes de apertar o play,
    // senão perde o começo do áudio.
    await new Promise((resolve) => setTimeout(resolve, 400));

    clickElement(playButton);

    // Para de gravar assim que detectar que a mensagem voltou a mostrar
    // "reproduzir" (ou seja, já tocou inteira) — sem isso, espera o tempo
    // máximo sempre.
    const start = Date.now();
    let sawPause = false;
    while (Date.now() - start < MAX_RECORD_MS) {
      const pauseEl = findPauseElement(container) || findPauseElement(document);
      if (pauseEl) {
        sawPause = true;
      } else if (sawPause) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    try {
      await chrome.runtime.sendMessage({ type: "STOP_RECORDING_EARLY" });
    } catch {
      // se a extensão recarregou nesse meio tempo, o timeout do lado do
      // offscreen ainda garante que a gravação para sozinha.
    }

    return recordPromise;
  }

  async function transcribe(playButton, container, button, resultEl) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      showResult(resultEl, "Nenhuma chave de API configurada. Clique no ícone do Ovy na barra de extensões.", true);
      return;
    }

    button.classList.add("ovy-loading");
    showResult(resultEl, "Transcrevendo…", false);

    try {
      const response = await captureAudioViaTabCapture(playButton, container);
      if (!response?.ok) {
        throw new Error(response?.error || "Não consegui capturar o áudio desta mensagem.");
      }

      const audioBlob = await (await fetch(response.dataUrl)).blob();
      const formData = new FormData();
      formData.append("audio", audioBlob, "whatsapp-audio.webm");

      const uploadResponse = await fetch(`${API_BASE}/api/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });
      const data = await uploadResponse.json().catch(() => ({}));

      if (!uploadResponse.ok) {
        throw new Error(data.error || `Falha ao transcrever (HTTP ${uploadResponse.status}).`);
      }

      const text = data.organizedText || data.faithfulText || "";
      showResult(resultEl, text || "(áudio sem fala reconhecível)", false);
      button.classList.remove("ovy-loading");
      button.classList.add("ovy-done");
    } catch (error) {
      button.classList.remove("ovy-loading");
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
    if (!isExtensionContextValid()) return; // extensão foi atualizada; essa instância antiga da página não deve mais agir.
    playButton.setAttribute(PROCESSED_ATTR, "1");

    // Qualquer chamada a chrome.* aqui pode lançar de repente se a extensão
    // for recarregada bem nesse instante (corrida rara) — isso é só ruído,
    // não quebra nada de verdade, então evitamos deixar isso virar um erro
    // não tratado na página.
    try {
      attachButtonUnsafe(playButton);
    } catch {
      // próxima varredura tenta de novo quando a página for recarregada.
    }
  }

  function attachButtonUnsafe(playButton) {
    // O container da mensagem é onde procuramos o botão de "pausar"
    // depois, e onde penduramos o resultado da transcrição.
    const container =
      playButton.closest("[data-id]") || playButton.closest('div[role="row"]') || playButton.parentElement;

    const button = document.createElement("button");
    button.className = "ovy-btn";
    button.type = "button";
    button.title = "Transcrever com Ovy";
    const logo = document.createElement("img");
    logo.src = chrome.runtime.getURL("icons/icon32.png");
    logo.alt = "Ovy";
    button.appendChild(logo);

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

    // O resultado vai no final do container da mensagem (bloco inteiro),
    // não logo depois do botão — senão ele fica espremido na fileira
    // estreita do player de áudio e o texto quebra palavra por palavra.
    (container || anchor.parentElement || document.body).appendChild(resultEl);
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
