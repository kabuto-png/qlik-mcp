"use strict";
/**
 * Popup Script
 *
 * Manages the popup UI and communicates with the background service worker.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const appName = document.getElementById("appName");
const qlikUrl = document.getElementById("qlikUrl");
const wsUrlInput = document.getElementById("wsUrl");
const saveBtn = document.getElementById("saveBtn");
const reconnectBtn = document.getElementById("reconnectBtn");
// Connect to background
const port = chrome.runtime.connect({ name: "popup" });
port.onMessage.addListener((msg) => {
    if (msg.type === "status") {
        updateUI(msg.state);
    }
});
function updateUI(state) {
    // Connection status
    if (state.connected) {
        statusDot.className = "status-dot connected";
        statusText.textContent = "Connected to MCP server";
    }
    else {
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
//# sourceMappingURL=popup.js.map