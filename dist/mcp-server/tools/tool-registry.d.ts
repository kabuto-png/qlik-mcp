/**
 * Tool Registry
 *
 * Registers all Qlik MCP tools with the server.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { QlikSessionManager } from "../core/session-manager.js";
import { ExtensionBridge } from "../bridge/extension-bridge.js";
export declare function registerAllTools(server: McpServer, sessionManager: QlikSessionManager, bridge: ExtensionBridge): void;
//# sourceMappingURL=tool-registry.d.ts.map