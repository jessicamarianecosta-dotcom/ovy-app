const input = document.getElementById("apiKey");
const status = document.getElementById("status");
const toggleBtn = document.getElementById("toggleCapture");
const captureStatus = document.getElementById("captureStatus");

chrome.storage.local.get(["ovyApiKey"], (result) => {
  if (result.ovyApiKey) {
    input.value = result.ovyApiKey;
    status.textContent = "Chave conectada.";
    status.style.color = "#16a34a";
  }
});

document.getElementById("save").addEventListener("click", () => {
  const value = input.value.trim();
  if (!value) {
    status.textContent = "Cole uma chave válida.";
    status.style.color = "#dc2626";
    return;
  }
  chrome.storage.local.set({ ovyApiKey: value }, () => {
    status.textContent = "Chave salva!";
    status.style.color = "#16a34a";
  });
});

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function refreshCaptureButton() {
  const tab = await getCurrentTab();
  if (!tab) return;
  const response = await chrome.runtime.sendMessage({ type: "GET_STATE" }).catch(() => null);
  const isActiveHere = response?.active && response?.tabId === tab.id;
  toggleBtn.textContent = isActiveHere ? "Parar legenda nesta aba" : "Ativar legenda nesta aba";
  toggleBtn.className = isActiveHere ? "stop" : "secondary";
  toggleBtn.dataset.active = isActiveHere ? "1" : "0";
}

toggleBtn.addEventListener("click", async () => {
  const tab = await getCurrentTab();
  if (!tab) return;

  toggleBtn.disabled = true;
  captureStatus.textContent = "";

  if (toggleBtn.dataset.active === "1") {
    await chrome.runtime.sendMessage({ type: "STOP_CAPTURE" });
    captureStatus.textContent = "Legenda desativada.";
  } else {
    const response = await chrome.runtime.sendMessage({ type: "START_CAPTURE", tabId: tab.id });
    if (!response?.ok) {
      captureStatus.textContent = response?.error || "Não foi possível iniciar.";
      captureStatus.style.color = "#dc2626";
      toggleBtn.disabled = false;
      return;
    }
    captureStatus.textContent = "Legenda ativada! A caixa flutuante vai aparecer na página.";
    captureStatus.style.color = "#16a34a";
  }

  toggleBtn.disabled = false;
  refreshCaptureButton();
});

refreshCaptureButton();
