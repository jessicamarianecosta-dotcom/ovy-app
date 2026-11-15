const input = document.getElementById("apiKey");
const status = document.getElementById("status");

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
