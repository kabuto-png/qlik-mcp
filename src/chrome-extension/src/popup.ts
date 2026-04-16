/**
 * Popup Script
 *
 * Manages the popup UI and communicates with the background service worker.
 */

interface ConnectionState {
  wsUrl: string;
  connected: boolean;
  qlikTabId: number | null;
  currentAppId: string | null;
  currentAppName: string | null;
}

const statusDot = document.getElementById("statusDot") as HTMLElement;
const statusText = document.getElementById("statusText") as HTMLElement;
const appName = document.getElementById("appName") as HTMLElement;
const qlikUrl = document.getElementById("qlikUrl") as HTMLElement;
const wsUrlInput = document.getElementById("wsUrl") as HTMLInputElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const reconnectBtn = document.getElementById("reconnectBtn") as HTMLButtonElement;

// Connect to background
const port = chrome.runtime.connect({ name: "popup" });

port.onMessage.addListener((msg) => {
  if (msg.type === "status") {
    updateUI(msg.state);
  }
});

function updateUI(state: ConnectionState): void {
  // Connection status
  if (state.connected) {
    statusDot.className = "status-dot connected";
    statusText.textContent = "Connected to MCP server";
  } else {
    statusDot.className = "status-dot disconnected";
    statusText.textContent = "Disconnected from MCP server";
  }

  // App info
  appName.textContent = state.currentAppName || "None";

  // URL (we'd need to fetch this from background)
  qlikUrl.textContent = state.qlikTabId ? "Active" : "-";

  // Settings
  wsUrlInput.value = state.wsUrl;
}

// Save button
saveBtn.addEventListener("click", () => {
  const url = wsUrlInput.value.trim();
  if (url) {
    port.postMessage({ type: "set-ws-url", url });
  }
});

// Reconnect button
reconnectBtn.addEventListener("click", () => {
  port.postMessage({ type: "reconnect" });
});
