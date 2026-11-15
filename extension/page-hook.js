// Roda no "mundo principal" da página (mesmo contexto JS do próprio
// WhatsApp Web), não no mundo isolado da extensão — só assim dá pra
// sobrescrever AudioContext.decodeAudioData e interceptar os bytes do
// áudio bem no momento em que o WhatsApp decodifica pra tocar (o player
// deles é customizado, sem tag <audio>, então não tem outro jeito de
// pegar o arquivo original).
(() => {
  function emit(buffer, source) {
    try {
      window.dispatchEvent(
        new CustomEvent("__ovyAudioBuffer", { detail: { buffer, source, size: buffer?.byteLength || 0 } })
      );
    } catch {
      // ignora falha isolada de um hook; os outros continuam valendo.
    }
  }

  function patchDecode(Ctor, source) {
    if (!Ctor || !Ctor.prototype || !Ctor.prototype.decodeAudioData || Ctor.prototype.__ovyPatched) return;
    const originalDecode = Ctor.prototype.decodeAudioData;
    Ctor.prototype.decodeAudioData = function (arrayBuffer, ...rest) {
      try {
        emit(arrayBuffer.slice(0), source);
      } catch {
        // segue o jogo mesmo sem clonar.
      }
      return originalDecode.call(this, arrayBuffer, ...rest);
    };
    Ctor.prototype.__ovyPatched = true;
  }

  // 1) AudioContext/OfflineAudioContext: cobre quando o áudio é decodificado
  // nativamente pelo navegador (ao vivo ou só pra desenhar a forma de onda).
  patchDecode(window.AudioContext, "audiocontext");
  patchDecode(window.webkitAudioContext, "audiocontext");
  patchDecode(window.OfflineAudioContext, "offlineaudiocontext");
  patchDecode(window.webkitOfflineAudioContext, "offlineaudiocontext");

  // 2) fetch(): caso o app baixe o arquivo já descriptografado/pronto via
  // uma resposta HTTP marcada como áudio.
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const result = originalFetch.apply(this, args);
    result
      .then((response) => {
        const contentType = response.headers?.get?.("content-type") || "";
        if (/audio|ogg|opus/i.test(contentType)) {
          response
            .clone()
            .arrayBuffer()
            .then((buffer) => emit(buffer, "fetch"))
            .catch(() => {});
        }
      })
      .catch(() => {});
    return result;
  };

  // 3) crypto.subtle.decrypt(): o WhatsApp usa criptografia ponta a ponta,
  // então a mídia chega criptografada e só vira bytes de verdade depois
  // dessa chamada — é provavelmente o ponto mais confiável de captura.
  if (window.crypto?.subtle?.decrypt) {
    const originalDecrypt = window.crypto.subtle.decrypt.bind(window.crypto.subtle);
    window.crypto.subtle.decrypt = function (...args) {
      const resultPromise = originalDecrypt(...args);
      resultPromise.then((buffer) => emit(buffer, "decrypt")).catch(() => {});
      return resultPromise;
    };
  }
})();
