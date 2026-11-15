let mediaRecorder = null;
let mediaStream = null;
let audioContext = null;

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

  mediaRecorder = new MediaRecorder(mediaStream, { mimeType: "audio/webm" });
  mediaRecorder.ondataavailable = async (event) => {
    if (event.data && event.data.size > 0) {
      const dataUrl = await blobToDataUrl(event.data);
      chrome.runtime.sendMessage({ type: "CHUNK_READY", dataUrl });
    }
  };
  mediaRecorder.start(8000); // emite um bloco a cada 8 segundos
}

function stopCapture() {
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
