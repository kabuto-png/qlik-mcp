/**
 * Tool Registry
 *
 * Registers all Qlik MCP tools with the server.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { QlikSessionManager } from "../core/session-manager.js";
import { ExtensionBridge } from "../bridge/extension-bridge.js";
import { registerConnectionTools } from "./connection-tools.js";
import { registerNavigationTools } from "./navigation-tools.js";
import { registerSelectionTools } from "./selection-tools.js";
import { registerDataTools } from "./data-tools.js";
import { registerBookmarkTools } from "./bookmark-tools.js";
import { registerExportTools } from "./export-tools.js";
import { registerQcTools } from "./qc-tools.js";
import { registerModelTools } from "./model-tools.js";
import { registerAnalysisTools } from "./analysis-tools.js";

export function registerAllTools(
  server: McpServer,
  sessionManager: QlikSessionManager,
  bridge: ExtensionBridge
): void {
  // Register tools by category
  registerConnectionTools(server, sessionManager, bridge);
  registerNavigationTools(server, sessionManager);
  registerSelectionTools(server, sessionManager);
  registerDataTools(server, sessionManager);
  registerBookmarkTools(server, sessionManager);
  registerExportTools(server, sessionManager);
  registerQcTools(server, sessionManager);
  registerModelTools(server, sessionManager);
  registerAnalysisTools(server, sessionManager);
}
