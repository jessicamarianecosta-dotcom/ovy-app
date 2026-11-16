let currentStream = null;
let currentAudioContext = null;
let currentRecorder = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "OFFSCREEN_RECORD") {
    recordOnce(message.streamId, message.maxMs)
      .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
  if (message.type === "OFFSCREEN_STOP_RECORDING") {
    if (currentRecorder && currentRecorder.state !== "inactive") currentRecorder.stop();
    sendResponse({ ok: true });
    return false;
  }
  if (message.type === "OFFSCREEN_STOP") {
    stopEverything();
    sendResponse({ ok: true });
    return false;
  }
});

function stopEverything() {
  try {
    currentStream?.getTracks().forEach((track) => track.stop());
  } catch {
    // já parado.
  }
  try {
    currentAudioContext?.close();
  } catch {
    // já fechado.
  }
  currentStream = null;
  currentAudioContext = null;
  currentRecorder = null;
}

async function recordOnce(streamId, maxMs) {
  stopEverything();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  });
  currentStream = stream;

  // Mantém o áudio audível normalmente (tabCapture silencia a aba por
  // padrão) — não precisa, mas evita qualquer efeito colateral estranho
  // na reprodução do WhatsApp Web.
  const audioContext = new AudioContext();
  currentAudioContext = audioContext;
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(audioContext.destination);

  const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
  currentRecorder = recorder;
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };

  const stopped = new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  recorder.start();
  const timer = setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, maxMs);

  await stopped;
  clearTimeout(timer);
  stopEverything();

  const blob = new Blob(chunks, { type: "audio/webm" });
  return blobToDataUrl(blob);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
