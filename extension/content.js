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
      position: fixed;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 999px;
      background: #111B36;
      color: #fff;
      border: 2px solid #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.35);
      cursor: pointer;
      font-size: 13px;
      flex-shrink: 0;
      z-index: 2147483000;
      padding: 0;
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
      position: fixed;
      display: block;
      box-sizing: border-box;
      width: 280px;
      max-width: 90vw;
      padding: 8px 10px;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.25);
      color: #111B36;
      font-size: 13px;
      line-height: 1.4;
      white-space: normal;
      word-break: normal;
      overflow-wrap: break-word;
      z-index: 2147483000;
    }
    .ovy-result.ovy-error { color: #b91c1c; }
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

  // Mensagens enviadas por mim ficam alinhadas à direita (classe
  // "message-out"), as recebidas à esquerda ("message-in") — alinha a
  // caixinha do Ovy do mesmo lado da bolha do áudio.
  function isOutgoingMessage(el) {
    let node = el;
    while (node && node !== document.body) {
      if (node.classList) {
        if (node.classList.contains("message-out")) return true;
        if (node.classList.contains("message-in")) return false;
      }
      node = node.parentElement;
    }
    return false;
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

  // O WhatsApp Web usa uma grade ARIA (role="grid" > role="row") com UMA
  // linha por mensagem — esse é o único jeito confiável de achar "o bloco
  // dessa mensagem específica". Um `.closest("[data-id]")` sem limite de
  // distância às vezes acha um ancestral comum a várias mensagens (ex: o
  // painel da conversa inteira), fazendo todas as caixinhas caírem no
  // mesmo lugar — por isso role="row" vem primeiro, e o fallback por
  // data-id só sobe um número limitado de níveis.
  function findMessageContainer(playButton) {
    const row = playButton.closest('div[role="row"]');
    if (row) return row;
    let node = playButton.parentElement;
    for (let i = 0; i < 8 && node; i++) {
      if (node.hasAttribute && node.hasAttribute("data-id")) return node;
      node = node.parentElement;
    }
    return playButton.parentElement;
  }

  function attachButtonUnsafe(playButton) {
    // O WhatsApp Web virtualiza a lista de mensagens (às vezes com
    // flex-direction invertido internamente), então anexar a caixinha
    // como filha do DOM da mensagem é imprevisível — ela pode aparecer
    // acima, embaixo ou longe do lugar certo dependendo da estrutura
    // interna deles. Em vez disso, ancoramos pela posição REAL na tela
    // (getBoundingClientRect) da bolha da mensagem, com position:fixed,
    // e recalculamos a cada scroll/resize — assim funciona não importa
    // como o WhatsApp organiza o DOM por dentro.
    const container = findMessageContainer(playButton);
    const outgoing = isOutgoingMessage(container || playButton);

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

    document.body.appendChild(button);
    document.body.appendChild(resultEl);

    const anchorEl = container || playButton;

    function reposition() {
      if (!document.body.contains(anchorEl) || !document.body.contains(playButton)) {
        cleanup();
        return;
      }
      const rect = anchorEl.getBoundingClientRect();
      const top = rect.bottom - 14;
      // O botão fica só a logo, coladinho na pontinha da bolha — sem
      // caixa nem texto; a caixa de resultado só aparece quando a
      // transcrição estiver pronta (ou der erro).
      if (outgoing) {
        button.style.left = "";
        button.style.right = `${Math.max(8, window.innerWidth - rect.right + 4)}px`;
      } else {
        button.style.right = "";
        button.style.left = `${Math.max(8, rect.right - 32)}px`;
      }
      button.style.top = `${top}px`;

      const resultTop = rect.bottom + 6;
      resultEl.style.top = `${resultTop}px`;
      if (outgoing) {
        resultEl.style.left = "";
        resultEl.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
      } else {
        resultEl.style.right = "";
        resultEl.style.left = `${Math.max(8, rect.left)}px`;
      }
    }

    function cleanup() {
      button.remove();
      resultEl.remove();
      clearInterval(watcher);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    }

    // Scroll dentro da área de mensagens dispara evento de scroll (captura
    // pega qualquer ancestral rolável); o intervalo cobre mudanças de
    // layout do WhatsApp que não disparam scroll/resize (nova mensagem
    // chegando, virtualização recalculando alturas).
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    const watcher = setInterval(reposition, 400);
    reposition();

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      transcribe(playButton, container || document, button, resultEl).finally(reposition);
    });
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
