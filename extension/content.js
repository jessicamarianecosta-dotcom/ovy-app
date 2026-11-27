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
      z-index: 2147483000;
      padding: 0;
    }
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
      position: fixed;
      display: block;
      box-sizing: border-box;
      width: 260px;
      max-width: 80vw;
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
    .ovy-result-text { padding-right: 18px; }
    .ovy-result-close {
      position: absolute;
      top: 4px;
      right: 6px;
      width: 18px;
      height: 18px;
      border: none;
      background: transparent;
      color: #9ca3af;
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }
    .ovy-result-close:hover { color: #111B36; }
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

  // Decide se ESTA mensagem específica ainda está tocando. Primeiro olha
  // pro próprio botão que clicamos (o WhatsApp normalmente reaproveita o
  // mesmo elemento e só troca o aria-label entre "reproduzir"/"pausar");
  // só se isso não for conclusivo é que procura dentro do container da
  // mensagem (nunca no documento inteiro — ver comentário acima).
  function isMessagePausing(playButton, container) {
    const ownLabel = playButton.getAttribute("aria-label") || "";
    if (PAUSE_LABEL_RE.test(ownLabel)) return true;
    if (PLAY_LABEL_RE.test(ownLabel)) return false;
    return Boolean(findPauseElement(container));
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

    // Para de gravar assim que detectar que ESTA mensagem (e só ela)
    // voltou a mostrar "reproduzir" (ou seja, já tocou inteira) — sem
    // isso, espera o tempo máximo sempre.
    //
    // Importante: o WhatsApp às vezes encadeia a reprodução automática de
    // vários áudios de voz seguidos (termina um, já começa o próximo
    // sozinho). Por isso NUNCA olhamos pro documento inteiro aqui — só
    // pro botão que a gente mesmo clicou (ou, no máximo, pra dentro da
    // mensagem dele). Se olhássemos pro documento inteiro, um "pausar"
    // que apareceu no áudio seguinte (que o WhatsApp tocou sozinho)
    // fazia a gente achar que o áudio clicado ainda tava tocando, e a
    // gravação continuava e grudava o áudio seguinte na transcrição —
    // mesmo sem o usuário ter clicado em transcrever esse outro áudio.
    const start = Date.now();
    let sawPause = false;
    while (Date.now() - start < MAX_RECORD_MS) {
      const stillPlayingThisMessage = isMessagePausing(playButton, container);
      if (stillPlayingThisMessage) {
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
    const textEl = resultEl.__ovyTextEl;
    if (textEl) textEl.textContent = text;
    else resultEl.textContent = text; // fallback de segurança, não deve acontecer
    resultEl.classList.toggle("ovy-error", Boolean(isError));
    resultEl.__ovyVisible = true;
    resultEl.style.display = "block";
    // Reposiciona já com o conteúdo novo — o texto pode ser mais alto ou
    // mais baixo que a "Transcrevendo…" anterior, e precisa decidir de
    // novo se cabe embaixo da bolha ou se é melhor abrir pra cima.
    resultEl.__ovyReposition?.();
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

  // O WhatsApp Web usa uma lista "virtualizada": conforme você rola a
  // conversa, ele reaproveita os MESMOS nós do DOM pra desenhar mensagens
  // diferentes (em vez de criar nó novo pra cada uma). Isso significa que
  // uma referência guardada (bubble/container) pode continuar "presente"
  // no documento, só que agora representando outra mensagem qualquer — e
  // é exatamente isso que fazia a caixa de transcrição "descolar" do
  // áudio certo e ficar flutuando perto do canto da tela (ancorada em
  // coordenadas de um nó que já não é mais aquele áudio, às vezes até
  // zerado). Cada linha de mensagem tem um `data-id` próprio que muda
  // quando o nó é reaproveitado pra outra mensagem — usamos isso como
  // "identidade" pra saber se ainda é a mesma.
  function captureIdentity(container) {
    if (!container) return null;
    const withId = container.hasAttribute && container.hasAttribute("data-id")
      ? container
      : container.querySelector && container.querySelector("[data-id]");
    return withId ? withId.getAttribute("data-id") : null;
  }

  function attachButtonUnsafe(playButton) {
    // A logo precisa ficar SEMPRE por cima de qualquer mensagem (inclusive
    // as que vêm depois, mais abaixo na conversa). Anexada como filha da
    // bolha, ela fica presa à ordem de empilhamento (z-index) daquela
    // bolha específica, que pode ser "coberta" pela próxima mensagem.
    // Por isso ela vai direto no body (sempre por cima de tudo), com
    // position: fixed, mas usando a MESMA posição geométrica real da
    // bolha (calculada uma vez e recalculada no scroll/resize).
    const container = findMessageContainer(playButton);
    const outgoing = isOutgoingByPosition(playButton, container);
    const bubble = findNarrowBubble(playButton, container) || container || playButton.parentElement;
    const identity = captureIdentity(container);

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
    resultEl.__ovyVisible = false; // controla a intenção do usuário (fechou ou não), separado do CSS

    const resultText = document.createElement("div");
    resultText.className = "ovy-result-text";
    resultEl.__ovyTextEl = resultText;

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "ovy-result-close";
    closeBtn.setAttribute("aria-label", "Fechar resultado da transcrição");
    closeBtn.title = "Fechar";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      // Só esconde — a transcrição já foi enviada e salva no histórico do
      // Ovy assim que ficou pronta, então fechar aqui não apaga nada. O
      // botão continua no lugar, podendo transcrever de novo se precisar.
      resultEl.__ovyVisible = false;
      resultEl.style.display = "none";
    });

    resultEl.appendChild(closeBtn);
    resultEl.appendChild(resultText);

    document.body.appendChild(button);
    document.body.appendChild(resultEl);

    function reposition() {
      if (!document.body.contains(bubble) || !document.body.contains(playButton)) {
        cleanup();
        return;
      }
      if (identity && captureIdentity(container) !== identity) {
        // Nó reaproveitado pra outra mensagem — não é mais "nosso" áudio.
        cleanup();
        return;
      }
      const rect = bubble.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        // Tamanho zero costuma significar que a lista virtualizada tirou
        // esse nó de cena momentaneamente. Em vez de grudar a caixa no
        // canto da tela com coordenadas erradas, só escondemos tudo até
        // a próxima varredura decidir se ele volta ou se é removido de
        // verdade (acima).
        button.style.display = "none";
        resultEl.style.display = "none";
        return;
      }
      button.style.display = "";
      if (resultEl.__ovyVisible) resultEl.style.display = "block";
      const top = rect.bottom - 14;
      button.style.top = `${top}px`;
      if (outgoing) {
        button.style.left = "";
        button.style.right = `${Math.max(8, window.innerWidth - rect.right - 10)}px`;
        resultEl.style.left = "";
        resultEl.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
      } else {
        button.style.right = "";
        button.style.left = `${Math.max(8, rect.right - 16)}px`;
        resultEl.style.right = "";
        resultEl.style.left = `${Math.max(8, rect.left)}px`;
      }

      // Se não tiver espaço embaixo (mensagem perto do rodapé, atrás da
      // barra de digitar), abre a caixa de resultado pra CIMA da bolha em
      // vez de para baixo — e limita a altura com rolagem própria, pra
      // nunca passar da tela nem em transcrições bem longas.
      if (resultEl.style.display !== "none") {
        resultEl.style.maxHeight = "none";
        resultEl.style.bottom = "";
        resultEl.style.top = "0px"; // mede a altura natural sem cortar embaixo
        const naturalHeight = resultEl.scrollHeight;
        const spaceBelow = window.innerHeight - rect.bottom - 10;
        const spaceAbove = rect.top - 10;
        if (naturalHeight <= spaceBelow || spaceBelow >= spaceAbove) {
          resultEl.style.top = `${rect.bottom + 6}px`;
          resultEl.style.maxHeight = `${Math.max(80, spaceBelow)}px`;
        } else {
          resultEl.style.top = "";
          resultEl.style.bottom = `${window.innerHeight - rect.top + 6}px`;
          resultEl.style.maxHeight = `${Math.max(80, spaceAbove)}px`;
        }
        resultEl.style.overflowY = "auto";
      }
    }

    function cleanup() {
      button.remove();
      resultEl.remove();
      clearInterval(watcher);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    }

    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    const watcher = setInterval(reposition, 400);
    resultEl.__ovyReposition = reposition;
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
