/**
 * Extension Bridge
 *
 * WebSocket server that communicates with the Qlik Chrome extension.
 * Handles bidirectional message passing between MCP server and browser.
 */
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
export declare class ExtensionBridge extends EventEmitter {
    private port;
    private wss;
    private client;
    private pendingRequests;
    private requestTimeout;
    private debug;
    constructor(port: number, debug?: boolean);
    start(): Promise<void>;
    stop(): Promise<void>;
    isConnected(): boolean;
    send<T = unknown>(action: string, payload?: unknown): Promise<T>;
    private handleMessage;
    private generateId;
    private log;
}
//# sourceMappingURL=extension-bridge.d.ts.map