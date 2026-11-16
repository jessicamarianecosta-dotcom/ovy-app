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
      position: absolute;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: #111B36;
      color: #fff;
      border: 2px solid #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.35);
      cursor: pointer;
      font-size: 13px;
      flex-shrink: 0;
      z-index: 20;
      padding: 0;
      bottom: -10px;
    }
    .ovy-btn.ovy-side-left { left: -10px; }
    .ovy-btn.ovy-side-right { right: -10px; }
    .ovy-btn:hover { background: #1b2a52; }
    .ovy-btn.ovy-loading { background: #8B5CF6; cursor: wait; opacity: 0.85; }
    .ovy-btn.ovy-done { background: #16a34a; }
    .ovy-btn img {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      pointer-events: none;
    }
    .ovy-result {
      position: absolute;
      display: block;
      box-sizing: border-box;
      width: 260px;
      max-width: 80vw;
      top: 100%;
      margin-top: 6px;
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
      z-index: 21;
    }
    .ovy-result.ovy-side-left { left: 0; }
    .ovy-result.ovy-side-right { right: 0; }
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

  // Tentamos antes achar a bolha por nome de classe ("message-in" /
  // "message-out"), mas isso não bateu com a estrutura real da página
  // (todo mundo caindo no mesmo lugar). Em vez de adivinhar nomes de
  // classe que podem mudar entre versões do WhatsApp Web, usamos só
  // geometria: a "linha" (role="row") sempre ocupa a largura inteira da
  // conversa, então dá pra saber se a mensagem é recebida (metade
  // esquerda) ou enviada (metade direita) comparando o centro do botão
  // de play com o centro da linha — e achar a bolha de verdade subindo
  // a partir do botão até o último ancestral bem mais estreito que a
  // linha inteira (a bolha não ocupa a largura toda, a linha sim).
  function isOutgoingByPosition(playButton, rowEl) {
    if (!rowEl) return false;
    const rowRect = rowEl.getBoundingClientRect();
    const btnRect = playButton.getBoundingClientRect();
    if (!rowRect.width || !btnRect.width) return false;
    const btnCenter = (btnRect.left + btnRect.right) / 2;
    const rowCenter = (rowRect.left + rowRect.right) / 2;
    return btnCenter > rowCenter;
  }

  function findNarrowBubble(playButton, rowEl) {
    const rowWidth = rowEl ? rowEl.getBoundingClientRect().width : 0;
    const limit = rowWidth > 0 ? rowWidth * 0.75 : Infinity;
    let node = playButton.parentElement;
    let best = null;
    for (let i = 0; i < 14 && node && node !== document.body && node !== rowEl; i++) {
      const width = node.getBoundingClientRect().width;
      if (width > 0 && width < limit) {
        best = node;
      } else if (best) {
        break;
      }
      node = node.parentElement;
    }
    return best;
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
    // Em vez de calcular a posição na tela via JavaScript (frágil: depende
    // de recalcular a toda hora, erra se a conta tiver um ajuste errado),
    // a logo é anexada como filha da própria bolha da mensagem
    // (position: absolute dentro dela) — assim ela acompanha o tamanho e
    // a posição da bolha automaticamente, por CSS puro, sem precisar
    // ouvir scroll/resize nem recalcular nada.
    const container = findMessageContainer(playButton);
    const outgoing = isOutgoingByPosition(playButton, container);
    const bubble = findNarrowBubble(playButton, container) || container || playButton.parentElement;
    // Corner oposto à borda da tela que a bolha já está perto, pra logo
    // não ficar cortada fora da área visível.
    const sideClass = outgoing ? "ovy-side-left" : "ovy-side-right";

    if (bubble && getComputedStyle(bubble).position === "static") {
      bubble.style.position = "relative";
    }

    const button = document.createElement("button");
    button.className = `ovy-btn ${sideClass}`;
    button.type = "button";
    button.title = "Transcrever com Ovy";
    const logo = document.createElement("img");
    logo.src = chrome.runtime.getURL("icons/icon32.png");
    logo.alt = "Ovy";
    button.appendChild(logo);

    const resultEl = document.createElement("div");
    resultEl.className = `ovy-result ${sideClass}`;
    resultEl.style.display = "none";

    (bubble || document.body).appendChild(button);
    (bubble || document.body).appendChild(resultEl);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      transcribe(playButton, container || document, button, resultEl);
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
