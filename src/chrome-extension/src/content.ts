/**
 * Content Script - Bridge between background and injected script
 */

interface BridgeMessage {
  id: string;
  type: "request" | "response" | "event";
  action: string;
  payload: Record<string, unknown>;
}

let injectedReady = false;
const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}>();

// Inject script into page context
function injectScript(): void {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

// Listen for responses from injected script
window.addEventListener("qlik-mcp-response", (event: Event) => {
  const { id, result, error } = (event as CustomEvent).detail;
  const pending = pendingRequests.get(id);
  if (pending) {
    pendingRequests.delete(id);
    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  }
});

// Listen for ready signal
window.addEventListener("qlik-mcp-ready", () => {
  console.log("[qlik-mcp] Injected script ready");
  injectedReady = true;
});

// Send request to injected script
function sendToInjected(action: string, payload: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pendingRequests.set(id, { resolve, reject });

    window.dispatchEvent(new CustomEvent("qlik-mcp-request", {
      detail: { id, action, payload }
    }));

    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error("Request timeout"));
      }
    }, 30000);
  });
}

// Wait for injected script to be ready
async function waitForInjected(): Promise<void> {
  if (injectedReady) return;

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50;

    const check = () => {
      if (injectedReady) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error("Injected script not ready"));
      } else {
        attempts++;
        setTimeout(check, 200);
      }
    };
    check();
  });
}

// Notify background of events
function notifyEvent(action: string, payload: unknown): void {
  chrome.runtime.sendMessage({
    type: "qlik-event",
    action,
    payload,
  });
}

// Initialize
async function init(): Promise<void> {
  console.log("[qlik-mcp] Content script starting...");

  // Register tab with background
  chrome.runtime.sendMessage({ type: "register-tab" });

  // Inject the page script
  injectScript();

  try {
    await waitForInjected();
    console.log("[qlik-mcp] Checking Qlik APIs...");

    const status = await sendToInjected("get-status") as { available: boolean; hasApp: boolean; appId?: string; appName?: string };
    console.log("[qlik-mcp] Qlik status:", status);

    if (status.hasApp && status.appId) {
      notifyEvent("app-opened", { appId: status.appId, appName: status.appName || "Unknown" });
    }
  } catch (err) {
    console.log("[qlik-mcp] Init error:", err);
  }
}

init();

// Handle messages from background
chrome.runtime.onMessage.addListener((message: BridgeMessage, _sender, sendResponse) => {
  handleAction(message)
    .then((result) => sendResponse({ result }))
    .catch((err) => sendResponse({ error: err.message }));
  return true;
});

async function handleAction(message: BridgeMessage): Promise<unknown> {
  await waitForInjected();

  const { action, payload } = message;

  switch (action) {
    case "list-apps":
      return sendToInjected("list-apps");

    case "open-app":
      return sendToInjected("open-app", payload);

    case "close-app":
      return { success: true }; // No-op for now

    case "get-sheets":
      return sendToInjected("get-sheets");

    case "go-to-sheet":
      return sendToInjected("go-to-sheet", payload);

    case "get-objects":
      return sendToInjected("get-objects");

    case "get-selections":
      return sendToInjected("get-selections");

    case "select":
      return sendToInjected("select", payload);

    case "clear-field":
      return sendToInjected("clear-field", payload);

    case "clear-all":
      return sendToInjected("clear-all");

    case "lock-field":
      return sendToInjected("lock-field", payload);

    case "unlock-field":
      return sendToInjected("unlock-field", payload);

    case "forward":
      return sendToInjected("forward");

    case "back":
      return sendToInjected("back");

    case "get-field-values":
      return sendToInjected("get-field-values", payload);

    case "get-data":
      return sendToInjected("get-data", payload);

    case "evaluate":
      return sendToInjected("evaluate", payload);

    case "get-variables":
      return sendToInjected("get-variables");

    case "set-variable":
      return sendToInjected("set-variable", payload);

    case "get-bookmarks":
      return sendToInjected("get-bookmarks");

    case "apply-bookmark":
      return sendToInjected("apply-bookmark", payload);

    case "create-bookmark":
      return sendToInjected("create-bookmark", payload);

    case "export":
      return sendToInjected("export", payload);

    case "screenshot":
      // Screenshot handled differently - capture visible area
      return { error: "Screenshot not implemented yet" };

    // Pass through all other actions to injected script
    default:
      return sendToInjected(action, payload);
  }
}
