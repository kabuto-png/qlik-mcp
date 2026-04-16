/**
 * Extension Bridge
 *
 * WebSocket server that communicates with the Qlik Chrome extension.
 * Handles bidirectional message passing between MCP server and browser.
 */

import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";

export interface BridgeMessage {
  id: string;
  type: "request" | "response" | "event";
  action: string;
  payload: unknown;
  error?: string;
}

export interface QlikAppInfo {
  id: string;
  name: string;
  thumbnail?: string;
}

export interface QlikSheetInfo {
  id: string;
  title: string;
  description?: string;
}

export interface QlikObjectInfo {
  id: string;
  type: string;
  title?: string;
}

export class ExtensionBridge extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private client: WebSocket | null = null;
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();
  private requestTimeout = 30000;
  private debug: boolean;

  constructor(private port: number, debug = false) {
    super();
    this.debug = debug;
  }

  async start(): Promise<void> {
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
            const message = JSON.parse(data.toString()) as BridgeMessage;
            this.handleMessage(message);
          } catch (err) {
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

  async stop(): Promise<void> {
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

  isConnected(): boolean {
    return this.client !== null && this.client.readyState === WebSocket.OPEN;
  }

  async send<T = unknown>(action: string, payload: unknown = {}): Promise<T> {
    if (!this.isConnected()) {
      throw new Error("Chrome extension not connected. Please open a Qlik Sense page with the extension installed.");
    }

    const id = this.generateId();
    const message: BridgeMessage = {
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

      this.pendingRequests.set(id, { resolve: resolve as (v: unknown) => void, reject, timeout });
      this.client!.send(JSON.stringify(message));
      this.log(`Sent: ${action}`, payload);
    });
  }

  private handleMessage(message: BridgeMessage): void {
    this.log(`Received: ${message.type}/${message.action}`, message.payload);

    if (message.type === "response") {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.payload);
        }
      }
    } else if (message.type === "event") {
      this.emit(message.action, message.payload);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.error("[bridge]", ...args);
    }
  }
}
