const API_BASE = "https://ovy-app.vercel.app";
let activeTabId = null;
let offscreenReady = null;

// Fila sequencial: nunca envia dois blocos em paralelo, evitando estourar o
// limite de requisições por minuto do Replicate (contas sem cartão cadastrado
// têm um limite bem baixo).
let chunkQueue = [];
let processingQueue = false;
let backoffUntil = 0;

async function ensureOffscreenDocument() {
  if (offscreenReady) return offscreenReady;
  offscreenReady = (async () => {
    const existing = await chrome.runtime.getContexts?.({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
    });
    if (existing && existing.length > 0) return;
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Capturar o áudio da aba para gerar legendas ao vivo.",
    });
  })();
  return offscreenReady;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_CAPTURE") {
    const tabId = message.tabId ?? sender.tab?.id;
    handleStart(tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }

  if (message.type === "STOP_CAPTURE") {
    handleStop()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "GET_STATE") {
    sendResponse({ active: activeTabId != null, tabId: activeTabId });
    return false;
  }

  if (message.type === "CHUNK_READY") {
    chunkQueue.push(message.dataUrl);
    processQueue();
    return false;
  }
});

async function handleStart(tabId) {
  if (!tabId) throw new Error("Aba não encontrada.");
  const { ovyApiKey } = await chrome.storage.local.get(["ovyApiKey"]);
  if (!ovyApiKey) {
    throw new Error("Nenhuma chave de API configurada. Clique no ícone da extensão.");
  }

  chunkQueue = [];
  activeTabId = tabId;
  await ensureOffscreenDocument();

  let streamId;
  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  } catch (error) {
    activeTabId = null;
    if (String(error.message || error).includes("has not been invoked")) {
      throw new Error(
        "O Chrome exige que você clique no ícone da extensão (não só no botão da página) para autorizar a captura desta aba. Use o botão “Ativar legenda nesta aba” aqui no popup."
      );
    }
    throw error;
  }

  await chrome.runtime.sendMessage({ type: "OFFSCREEN_START", streamId });
  chrome.tabs.sendMessage(tabId, { type: "OVY_CAPTURE_STARTED" }).catch(() => {});
}

async function handleStop() {
  await chrome.runtime.sendMessage({ type: "OFFSCREEN_STOP" }).catch(() => {});
  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, { type: "OVY_CAPTURE_STOPPED" }).catch(() => {});
  }
  activeTabId = null;
  chunkQueue = [];
}

async function processQueue() {
  if (processingQueue) return;
  processingQueue = true;
  try {
    while (chunkQueue.length > 0) {
      if (Date.now() < backoffUntil) {
        await sleep(backoffUntil - Date.now());
      }
      // Se vários blocos se acumularam durante uma pausa, descarta os mais
      // antigos: preferimos ficar perto do "ao vivo" a processar tudo atrasado.
      while (chunkQueue.length > 3) chunkQueue.shift();
      const dataUrl = chunkQueue.shift();
      await handleChunk(dataUrl);
    }
  } finally {
    processingQueue = false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

async function handleChunk(dataUrl) {
  if (!activeTabId) return;
  const { ovyApiKey } = await chrome.storage.local.get(["ovyApiKey"]);
  if (!ovyApiKey) return;

  const blob = await (await fetch(dataUrl)).blob();
  if (blob.size < 2000) return; // bloco quase vazio (silêncio), ignora

  const formData = new FormData();
  formData.append("audio", blob, "chunk.webm");

  try {
    const response = await fetch(`${API_BASE}/api/extension/transcribe-chunk`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ovyApiKey}` },
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 429) {
      const retryAfterSeconds = Number(data.retryAfter) || 5;
      backoffUntil = Date.now() + retryAfterSeconds * 1000;
      chrome.tabs.sendMessage(activeTabId, {
        type: "OVY_ERROR",
        error: `${data.error || "Limite de requisições atingido."} Pausando ${retryAfterSeconds}s…`,
      });
      return;
    }

    if (!response.ok) {
      chrome.tabs.sendMessage(activeTabId, {
        type: "OVY_ERROR",
        error: data.error || `Falha ao transcrever (HTTP ${response.status}).`,
      });
      return;
    }

    if (data.text) {
      chrome.tabs.sendMessage(activeTabId, { type: "OVY_CAPTION", text: data.text });
    }
  } catch (error) {
    chrome.tabs.sendMessage(activeTabId, {
      type: "OVY_ERROR",
      error: `Erro de rede ao transcrever bloco: ${error.message || error}`,
    });
  }
}
