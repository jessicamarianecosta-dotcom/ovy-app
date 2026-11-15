(() => {
  if (window.__ovyInjected) return;
  window.__ovyInjected = true;

  const host = document.createElement("div");
  host.id = "ovy-extension-host";
  host.style.cssText = "position:fixed;inset:auto;z-index:2147483647;";
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .ovy-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 52px;
      height: 52px;
      border-radius: 999px;
      background: #111B36;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(17,27,54,0.35);
      font-size: 22px;
      font-family: system-ui, sans-serif;
    }
    .ovy-fab.active {
      background: #8B5CF6;
    }
    .ovy-panel {
      position: fixed;
      bottom: 88px;
      right: 24px;
      width: 320px;
      max-height: 260px;
      overflow-y: auto;
      background: rgba(17,27,54,0.92);
      color: white;
      border-radius: 16px;
      padding: 14px 16px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      display: none;
      backdrop-filter: blur(4px);
    }
    .ovy-panel.visible {
      display: block;
    }
    .ovy-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-weight: 600;
      color: #D8B4FE;
    }
    .ovy-panel-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }
    .ovy-line {
      margin-bottom: 6px;
    }
    .ovy-error {
      color: #fca5a5;
    }
  `;
  shadow.appendChild(style);

  const fab = document.createElement("button");
  fab.className = "ovy-fab";
  fab.title = "Ovy — legenda ao vivo";
  fab.textContent = "🎙";
  shadow.appendChild(fab);

  const panel = document.createElement("div");
  panel.className = "ovy-panel";
  panel.innerHTML = `
    <div class="ovy-panel-header">
      <span>Ovy — legenda ao vivo</span>
      <button class="ovy-panel-close" title="Fechar">✕</button>
    </div>
    <div class="ovy-lines"></div>
  `;
  shadow.appendChild(panel);

  const linesEl = panel.querySelector(".ovy-lines");
  const closeBtn = panel.querySelector(".ovy-panel-close");

  let active = false;

  function addLine(text, isError = false) {
    const line = document.createElement("div");
    line.className = isError ? "ovy-line ovy-error" : "ovy-line";
    line.textContent = text;
    linesEl.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
  }

  function isExtensionContextValid() {
    return Boolean(chrome?.runtime?.id);
  }

  async function start() {
    if (!isExtensionContextValid()) {
      panel.classList.add("visible");
      addLine("A extensão foi atualizada. Recarregue esta página (F5) e tente de novo.", true);
      return;
    }
    panel.classList.add("visible");
    linesEl.innerHTML = "";
    addLine("Ativando captura de áudio da aba…");
    const response = await chrome.runtime.sendMessage({ type: "START_CAPTURE" }).catch(() => null);
    if (!response?.ok) {
      addLine(
        response?.error ||
          "Não foi possível iniciar pelo botão da página. Clique no ícone do Ovy na barra de extensões e use “Ativar legenda nesta aba”.",
        true
      );
      active = false;
      fab.classList.remove("active");
      return;
    }
    linesEl.innerHTML = "";
    active = true;
    fab.classList.add("active");
  }

  async function stop() {
    if (isExtensionContextValid()) {
      await chrome.runtime.sendMessage({ type: "STOP_CAPTURE" }).catch(() => {});
    }
    active = false;
    fab.classList.remove("active");
  }

  // A captura também pode ter sido iniciada/parada pelo popup da extensão
  // (clique no ícone da barra de ferramentas), não só pelo botão da página.
  function syncStarted() {
    panel.classList.add("visible");
    linesEl.innerHTML = "";
    active = true;
    fab.classList.add("active");
  }

  function syncStopped() {
    active = false;
    fab.classList.remove("active");
  }

  fab.addEventListener("click", () => {
    if (active) {
      stop();
    } else {
      start();
    }
  });

  closeBtn.addEventListener("click", () => {
    stop();
    panel.classList.remove("visible");
  });

  if (isExtensionContextValid()) {
    chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "OVY_CAPTION") {
      addLine(message.text);
    }
    if (message.type === "OVY_ERROR") {
      addLine(message.error, true);
    }
    if (message.type === "OVY_CAPTURE_STARTED") {
      syncStarted();
    }
    if (message.type === "OVY_CAPTURE_STOPPED") {
      syncStopped();
    }
    });
  }
})();
