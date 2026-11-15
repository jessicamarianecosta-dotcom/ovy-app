// Roda no "mundo principal" da página (mesmo contexto JS do próprio
// WhatsApp Web), não no mundo isolado da extensão — só assim dá pra
// sobrescrever AudioContext.decodeAudioData e interceptar os bytes do
// áudio bem no momento em que o WhatsApp decodifica pra tocar (o player
// deles é customizado, sem tag <audio>, então não tem outro jeito de
// pegar o arquivo original).
(() => {
  function patch(Ctor) {
    if (!Ctor || !Ctor.prototype || !Ctor.prototype.decodeAudioData || Ctor.prototype.__ovyPatched) return;
    const originalDecode = Ctor.prototype.decodeAudioData;
    Ctor.prototype.decodeAudioData = function (arrayBuffer, ...rest) {
      try {
        const clone = arrayBuffer.slice(0);
        window.dispatchEvent(new CustomEvent("__ovyAudioBuffer", { detail: { buffer: clone } }));
      } catch {
        // se não der pra clonar, só segue o jogo sem capturar nada.
      }
      return originalDecode.call(this, arrayBuffer, ...rest);
    };
    Ctor.prototype.__ovyPatched = true;
  }

  // Cobre tanto AudioContext (tocar ao vivo) quanto OfflineAudioContext
  // (usado às vezes só pra desenhar a forma de onda, sem tocar de verdade).
  patch(window.AudioContext);
  patch(window.webkitAudioContext);
  patch(window.OfflineAudioContext);
  patch(window.webkitOfflineAudioContext);

  // fetch() também é um jeito comum de baixar o áudio antes de decodificar
  // — guardamos a última resposta de áudio buscada pela própria página
  // como plano B, caso o app não use decodeAudioData pra tocar.
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
            .then((buffer) => {
              window.dispatchEvent(new CustomEvent("__ovyAudioBuffer", { detail: { buffer } }));
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
    return result;
  };
})();
