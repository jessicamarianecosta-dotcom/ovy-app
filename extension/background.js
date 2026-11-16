let offscreenReady = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

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
      justification: "Capturar o áudio da aba pra transcrever a mensagem clicada.",
    });
  })();
  return offscreenReady;
}

// Avisa o offscreen pra soltar a stream e destrói o documento por
// completo — é a única forma garantida de encerrar qualquer MediaStream
// que tenha ficado preso, evitando "Cannot capture a tab with an active
// stream" numa tentativa seguinte.
async function forceReleaseAnyCapture() {
  try {
    await Promise.race([chrome.runtime.sendMessage({ type: "OFFSCREEN_STOP" }), sleep(1500)]);
  } catch {
    // sem documento offscreen pra responder, tudo bem.
  }
  try {
    await chrome.offscreen.closeDocument();
  } catch {
    // já não existia nenhum documento offscreen.
  }
  offscreenReady = null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RECORD_TAB_AUDIO") {
    const tabId = sender.tab?.id;
    recordTabAudio(tabId, message.maxMs || 20000)
      .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
      .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }

  if (message.type === "STOP_RECORDING_EARLY") {
    chrome.runtime.sendMessage({ type: "OFFSCREEN_STOP_RECORDING" }).catch(() => {});
    return false;
  }
});

async function recordTabAudio(tabId, maxMs) {
  if (!tabId) throw new Error("Aba não encontrada.");

  await forceReleaseAnyCapture();
  await ensureOffscreenDocument();

  let streamId;
  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  } catch (error) {
    if (String(error.message || error).includes("has not been invoked")) {
      throw new Error(
        "Clique no ícone do Ovy na barra de extensões (abre e fecha o popup) e tente de novo — o Chrome exige isso uma vez por aba antes de liberar a captura de áudio."
      );
    }
    throw error;
  }

  const response = await Promise.race([
    chrome.runtime.sendMessage({ type: "OFFSCREEN_RECORD", streamId, maxMs }),
    sleep(maxMs + 5000).then(() => null),
  ]);

  await forceReleaseAnyCapture();

  if (!response?.ok) {
    throw new Error(response?.error || "Não consegui gravar o áudio da aba.");
  }
  return response.dataUrl;
}
