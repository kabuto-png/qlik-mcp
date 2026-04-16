/**
 * Connection Tools
 *
 * Tools for connecting to Qlik and managing app sessions.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { QlikSessionManager } from "../core/session-manager.js";
import { ExtensionBridge } from "../bridge/extension-bridge.js";
export declare function registerConnectionTools(server: McpServer, sessionManager: QlikSessionManager, bridge: ExtensionBridge): void;
//# sourceMappingURL=connection-tools.d.ts.map