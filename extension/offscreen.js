let mediaRecorder = null;
let mediaStream = null;
let audioContext = null;
let chunkTimer = null;
let stopping = false;

const CHUNK_MS = 8000;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "OFFSCREEN_START") {
    startCapture(message.streamId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
  if (message.type === "OFFSCREEN_STOP") {
    stopCapture();
    sendResponse({ ok: true });
    return false;
  }
});

async function startCapture(streamId) {
  stopCapture();
  stopping = false;

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  });

  // Mantém o áudio original audível (tabCapture silencia a aba por padrão).
  audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(mediaStream);
  source.connect(audioContext.destination);

  startNextChunkRecorder();
}

// IMPORTANTE: não usamos `mediaRecorder.start(timeslice)`. Quando o
// MediaRecorder emite blobs em intervalos (timeslice), apenas o PRIMEIRO
// blob contém o cabeçalho do container WebM — os blobs seguintes são
// fragmentos sem cabeçalho, que o decodificador do modelo de transcrição
// não consegue abrir sozinhos (por isso só o primeiro bloco transcrevia e
// os seguintes falhavam com "Falha ao transcrever este bloco" ou vinham
// vazios). Em vez disso, criamos um MediaRecorder novo a cada ciclo: cada
// um grava um arquivo WebM completo e independente.
function startNextChunkRecorder() {
  if (!mediaStream || stopping) return;

  const recorder = new MediaRecorder(mediaStream, { mimeType: "audio/webm" });
  const localChunks = [];
  mediaRecorder = recorder;

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) localChunks.push(event.data);
  };

  recorder.onstop = async () => {
    if (localChunks.length > 0) {
      const blob = new Blob(localChunks, { type: "audio/webm" });
      const dataUrl = await blobToDataUrl(blob);
      chrome.runtime.sendMessage({ type: "CHUNK_READY", dataUrl });
    }
    if (!stopping && mediaStream) {
      startNextChunkRecorder();
    }
  };

  recorder.start();
  chunkTimer = setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, CHUNK_MS);
}

function stopCapture() {
  stopping = true;
  if (chunkTimer) {
    clearTimeout(chunkTimer);
    chunkTimer = null;
  }
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  mediaRecorder = null;
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }
  mediaStream = null;
  if (audioContext) {
    audioContext.close();
  }
  audioContext = null;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
