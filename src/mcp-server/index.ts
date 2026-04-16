#!/usr/bin/env node
/**
 * Qlik MCP Server
 *
 * MCP server that bridges Claude to Qlik Sense via Chrome extension.
 * Communicates with Qlik Capability APIs through injected scripts.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ExtensionBridge } from "./bridge/extension-bridge.js";
import { registerAllTools } from "./tools/tool-registry.js";
import { QlikSessionManager } from "./core/session-manager.js";

const VERSION = "1.0.0";
const DEFAULT_BRIDGE_PORT = 9876;

async function main() {
  const args = process.argv.slice(2);
  const bridgePort = parseInt(args.find(a => a.startsWith("--port="))?.split("=")[1] || String(DEFAULT_BRIDGE_PORT));
  const debug = args.includes("--debug");

  // Initialize MCP server
  const server = new McpServer({
    name: "qlik-mcp",
    version: VERSION,
  });

  // Initialize extension bridge (WebSocket server for Chrome extension)
  const bridge = new ExtensionBridge(bridgePort, debug);

  // Initialize Qlik session manager
  const sessionManager = new QlikSessionManager(bridge, debug);

  // Register all Qlik tools
  registerAllTools(server, sessionManager, bridge);

  // Start WebSocket bridge
  await bridge.start();

  if (debug) {
    console.error(`[qlik-mcp] Bridge listening on ws://localhost:${bridgePort}`);
  }

  // Connect MCP via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  if (debug) {
    console.error("[qlik-mcp] MCP server connected via stdio");
  }

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await sessionManager.closeAll();
    await bridge.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await sessionManager.closeAll();
    await bridge.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[qlik-mcp] Fatal error:", err);
  process.exit(1);
});
