// Roda no "mundo principal" da página (mesmo contexto JS do próprio
// WhatsApp Web), não no mundo isolado da extensão — só assim dá pra
// sobrescrever AudioContext.decodeAudioData e interceptar os bytes do
// áudio bem no momento em que o WhatsApp decodifica pra tocar (o player
// deles é customizado, sem tag <audio>, então não tem outro jeito de
// pegar o arquivo original).
(() => {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor || Ctor.prototype.__ovyPatched) return;

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
})();
