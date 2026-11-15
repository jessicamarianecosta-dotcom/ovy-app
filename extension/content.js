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
      width: 52px;
      height: 52px;
      border-radius: 999px;
      background: #111B36;
      color: white;
      border: none;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(17,27,54,0.35);
      font-size: 22px;
      font-family: system-ui, sans-serif;
      touch-action: none;
      user-select: none;
    }
    .ovy-fab.active {
      background: #8B5CF6;
    }
    .ovy-fab.dragging {
      cursor: grabbing;
      opacity: 0.85;
    }
    .ovy-panel {
      position: fixed;
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

  const FAB_SIZE = 52;
  const MARGIN = 12;
  const DEFAULT_POS = { left: window.innerWidth - FAB_SIZE - 24, top: window.innerHeight - FAB_SIZE - 24 };

  function clampPos(pos) {
    const maxLeft = window.innerWidth - FAB_SIZE - MARGIN;
    const maxTop = window.innerHeight - FAB_SIZE - MARGIN;
    return {
      left: Math.min(Math.max(pos.left, MARGIN), Math.max(MARGIN, maxLeft)),
      top: Math.min(Math.max(pos.top, MARGIN), Math.max(MARGIN, maxTop)),
    };
  }

  function applyPos(pos) {
    fab.style.left = `${pos.left}px`;
    fab.style.top = `${pos.top}px`;
    positionPanel(pos);
  }

  function positionPanel(fabPos) {
    // Mostra o painel acima do botão, ou abaixo se não couber.
    const panelHeight = 260;
    const spaceAbove = fabPos.top;
    if (spaceAbove > panelHeight + 20) {
      panel.style.top = "";
      panel.style.bottom = `${window.innerHeight - fabPos.top + 12}px`;
    } else {
      panel.style.bottom = "";
      panel.style.top = `${fabPos.top + FAB_SIZE + 12}px`;
    }
    const left = Math.min(Math.max(fabPos.left - 320 + FAB_SIZE, MARGIN), window.innerWidth - 320 - MARGIN);
    panel.style.left = `${left}px`;
  }

  function savePos(pos) {
    try {
      chrome.storage?.local?.set?.({ ovyFabPos: pos });
    } catch {
      // contexto pode estar inválido; posição só não persiste desta vez.
    }
  }

  let currentPos = DEFAULT_POS;
  applyPos(currentPos);

  if (isExtensionContextValid()) {
    chrome.storage.local.get(["ovyFabPos"], (result) => {
      if (result?.ovyFabPos) {
        currentPos = clampPos(result.ovyFabPos);
        applyPos(currentPos);
      }
    });
  }

  let dragState = null;

  fab.addEventListener("pointerdown", (event) => {
    dragState = {
      startX: event.clientX,
      startY: event.clientY,
      origLeft: currentPos.left,
      origTop: currentPos.top,
      moved: false,
    };
    fab.setPointerCapture(event.pointerId);
  });

  fab.addEventListener("pointermove", (event) => {
    if (!dragState) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragState.moved = true;
      fab.classList.add("dragging");
    }
    if (dragState.moved) {
      currentPos = clampPos({ left: dragState.origLeft + dx, top: dragState.origTop + dy });
      applyPos(currentPos);
    }
  });

  function endDrag(event) {
    if (!dragState) return;
    fab.releasePointerCapture?.(event.pointerId);
    const wasDrag = dragState.moved;
    fab.classList.remove("dragging");
    dragState = null;
    if (wasDrag) {
      savePos(currentPos);
    } else {
      toggleCapture();
    }
  }

  fab.addEventListener("pointerup", endDrag);
  fab.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", () => {
    currentPos = clampPos(currentPos);
    applyPos(currentPos);
  });

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
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 8000));
    let response = null;
    try {
      response = await Promise.race([
        chrome.runtime.sendMessage({ type: "START_CAPTURE" }).catch(() => null),
        timeout,
      ]);
    } catch {
      response = null;
    }
    if (!isExtensionContextValid()) {
      addLine("A extensão foi atualizada. Recarregue esta página (F5) e tente de novo.", true);
      active = false;
      fab.classList.remove("active");
      return;
    }
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
      try {
        await chrome.runtime.sendMessage({ type: "STOP_CAPTURE" }).catch(() => {});
      } catch {
        // contexto invalidado durante a chamada; ignora.
      }
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

  function toggleCapture() {
    if (active) {
      stop();
    } else {
      start();
    }
  }

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
