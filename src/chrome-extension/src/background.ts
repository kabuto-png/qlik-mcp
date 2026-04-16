/**
 * Background Service Worker
 *
 * Manages WebSocket connection to MCP server and routes messages to content scripts.
 */

const DEFAULT_WS_URL = "ws://localhost:9876";

interface BridgeMessage {
  id: string;
  type: "request" | "response" | "event";
  action: string;
  payload: unknown;
  error?: string;
}

interface ConnectionState {
  wsUrl: string;
  connected: boolean;
  qlikTabId: number | null;
  currentAppId: string | null;
  currentAppName: string | null;
}

let ws: WebSocket | null = null;
let state: ConnectionState = {
  wsUrl: DEFAULT_WS_URL,
  connected: false,
  qlikTabId: null,
  currentAppId: null,
  currentAppName: null,
};

// Load saved settings
chrome.storage.local.get(["wsUrl"], (result) => {
  if (result.wsUrl) {
    state.wsUrl = result.wsUrl;
  }
  connect();
});

// Keepalive alarm to prevent service worker suspension
chrome.alarms.create("keepalive", { periodInMinutes: 0.4 }); // ~24 seconds

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepalive") {
    // Send ping to keep WebSocket alive
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id: "ping", type: "event", action: "ping", payload: {} }));
    } else if (!ws || ws.readyState === WebSocket.CLOSED) {
      // Reconnect if disconnected
      connect();
    }
  }
});

// WebSocket connection management
function connect(): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }

  console.log("[qlik-mcp] Connecting to:", state.wsUrl);
  ws = new WebSocket(state.wsUrl);

  ws.onopen = () => {
    console.log("[qlik-mcp] Connected to MCP server");
    state.connected = true;
    updateBadge(true);
  };

  ws.onclose = () => {
    console.log("[qlik-mcp] Disconnected from MCP server");
    state.connected = false;
    updateBadge(false);
    // Reconnect after delay
    setTimeout(connect, 5000);
  };

  ws.onerror = (error) => {
    console.error("[qlik-mcp] WebSocket error:", error);
  };

  ws.onmessage = async (event) => {
    try {
      const message: BridgeMessage = JSON.parse(event.data);
      console.log("[qlik-mcp] Received:", message.action);
      await handleMcpRequest(message);
    } catch (err) {
      console.error("[qlik-mcp] Failed to parse message:", err);
    }
  };
}

function updateBadge(connected: boolean): void {
  chrome.action.setBadgeText({ text: connected ? "ON" : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: connected ? "#22c55e" : "#ef4444" });
}

async function handleMcpRequest(message: BridgeMessage): Promise<void> {
  if (message.type !== "request") return;

  try {
    let result: unknown;

    switch (message.action) {
      case "get-status":
        result = {
          extensionConnected: true,
          currentApp: state.currentAppId
            ? { id: state.currentAppId, name: state.currentAppName }
            : null,
          qlikUrl: state.qlikTabId ? await getTabUrl(state.qlikTabId) : null,
        };
        break;

      default:
        // Forward to content script
        if (!state.qlikTabId) {
          throw new Error("No Qlik tab active. Please open a Qlik Sense app.");
        }
        result = await sendToContentScript(state.qlikTabId, message);
        break;
    }

    sendResponse(message.id, result);
  } catch (err) {
    sendError(message.id, (err as Error).message);
  }
}

async function sendToContentScript(tabId: number, message: BridgeMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response?.result);
      }
    });
  });
}

async function getTabUrl(tabId: number): Promise<string | null> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.url || null;
  } catch {
    return null;
  }
}

function sendResponse(id: string, payload: unknown): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      id,
      type: "response",
      action: "result",
      payload,
    }));
  }
}

function sendError(id: string, error: string): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      id,
      type: "response",
      action: "error",
      payload: null,
      error,
    }));
  }
}

function sendEvent(action: string, payload: unknown): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      id: `evt-${Date.now()}`,
      type: "event",
      action,
      payload,
    }));
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "qlik-event") {
    // Forward Qlik events to MCP server
    sendEvent(message.action, message.payload);

    // Update state
    if (message.action === "app-opened") {
      state.currentAppId = message.payload.appId;
      state.currentAppName = message.payload.appName;
      state.qlikTabId = sender.tab?.id || null;
    } else if (message.action === "app-closed") {
      state.currentAppId = null;
      state.currentAppName = null;
    }
  } else if (message.type === "register-tab") {
    state.qlikTabId = sender.tab?.id || null;
    sendResponse({ success: true });
  }
  return true;
});

// Listen for tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === state.qlikTabId) {
    state.qlikTabId = null;
    state.currentAppId = null;
    state.currentAppName = null;
    sendEvent("app-closed", { appId: state.currentAppId });
  }
});

// Handle popup connection status requests
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    port.postMessage({ type: "status", state });

    port.onMessage.addListener((msg) => {
      if (msg.type === "set-ws-url") {
        state.wsUrl = msg.url;
        chrome.storage.local.set({ wsUrl: msg.url });
        if (ws) {
          ws.close();
        }
        connect();
      } else if (msg.type === "reconnect") {
        if (ws) {
          ws.close();
        }
        connect();
      }
    });
  }
});
