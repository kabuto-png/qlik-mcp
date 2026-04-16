/**
 * Extension Bridge
 *
 * WebSocket server that communicates with the Qlik Chrome extension.
 * Handles bidirectional message passing between MCP server and browser.
 */
import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";
export class ExtensionBridge extends EventEmitter {
    port;
    wss = null;
    client = null;
    pendingRequests = new Map();
    requestTimeout = 30000;
    debug;
    constructor(port, debug = false) {
        super();
        this.port = port;
        this.debug = debug;
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.wss = new WebSocketServer({ port: this.port });
            this.wss.on("listening", () => {
                this.log("WebSocket server started");
                resolve();
            });
            this.wss.on("error", (err) => {
                this.log("WebSocket server error:", err);
                reject(err);
            });
            this.wss.on("connection", (ws) => {
                this.log("Chrome extension connected");
                this.client = ws;
                this.emit("connected");
                ws.on("message", (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleMessage(message);
                    }
                    catch (err) {
                        this.log("Failed to parse message:", err);
                    }
                });
                ws.on("close", () => {
                    this.log("Chrome extension disconnected");
                    this.client = null;
                    this.emit("disconnected");
                });
                ws.on("error", (err) => {
                    this.log("WebSocket client error:", err);
                });
            });
        });
    }
    async stop() {
        if (this.client) {
            this.client.close();
            this.client = null;
        }
        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests) {
            clearTimeout(pending.timeout);
            pending.reject(new Error("Bridge shutdown"));
            this.pendingRequests.delete(id);
        }
    }
    isConnected() {
        return this.client !== null && this.client.readyState === WebSocket.OPEN;
    }
    async send(action, payload = {}) {
        if (!this.isConnected()) {
            throw new Error("Chrome extension not connected. Please open a Qlik Sense page with the extension installed.");
        }
        const id = this.generateId();
        const message = {
            id,
            type: "request",
            action,
            payload,
        };
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`Request timeout: ${action}`));
            }, this.requestTimeout);
            this.pendingRequests.set(id, { resolve: resolve, reject, timeout });
            this.client.send(JSON.stringify(message));
            this.log(`Sent: ${action}`, payload);
        });
    }
    handleMessage(message) {
        this.log(`Received: ${message.type}/${message.action}`, message.payload);
        if (message.type === "response") {
            const pending = this.pendingRequests.get(message.id);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(message.id);
                if (message.error) {
                    pending.reject(new Error(message.error));
                }
                else {
                    pending.resolve(message.payload);
                }
            }
        }
        else if (message.type === "event") {
            this.emit(message.action, message.payload);
        }
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
    log(...args) {
        if (this.debug) {
            console.error("[bridge]", ...args);
        }
    }
}
//# sourceMappingURL=extension-bridge.js.map