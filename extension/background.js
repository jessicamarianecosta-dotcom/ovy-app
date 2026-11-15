const API_BASE = "https://ovy-app.vercel.app";
let activeTabId = null;
let offscreenReady = null;

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
    handleStart(sender.tab?.id ?? message.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "STOP_CAPTURE") {
    handleStop()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "CHUNK_READY") {
    handleChunk(message.dataUrl).catch((error) =>
      console.error("Ovy: falha ao transcrever bloco", error)
    );
    return false;
  }
});

async function handleStart(tabId) {
  if (!tabId) throw new Error("Aba não encontrada.");
  const { ovyApiKey } = await chrome.storage.local.get(["ovyApiKey"]);
  if (!ovyApiKey) {
    throw new Error("Nenhuma chave de API configurada. Clique no ícone da extensão.");
  }

  activeTabId = tabId;
  await ensureOffscreenDocument();

  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  await chrome.runtime.sendMessage({ type: "OFFSCREEN_START", streamId });
}

async function handleStop() {
  await chrome.runtime.sendMessage({ type: "OFFSCREEN_STOP" }).catch(() => {});
  activeTabId = null;
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
    const data = await response.json();
    if (!response.ok) {
      chrome.tabs.sendMessage(activeTabId, {
        type: "OVY_ERROR",
        error: data.error ?? "Falha ao transcrever.",
      });
      return;
    }
    if (data.text) {
      chrome.tabs.sendMessage(activeTabId, { type: "OVY_CAPTION", text: data.text });
    }
  } catch (error) {
    console.error("Ovy: erro de rede ao transcrever bloco", error);
  }
}
