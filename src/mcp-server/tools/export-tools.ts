/**
 * Export Tools
 *
 * Tools for exporting data and taking screenshots.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { QlikSessionManager } from "../core/session-manager.js";

export function registerExportTools(
  server: McpServer,
  sessionManager: QlikSessionManager
): void {
  // Export object data
  server.tool(
    "qlik_export",
    "Export data from a Qlik object to a file",
    {
      object_id: z.string().describe("ID of the object to export"),
      format: z.enum(["csv", "xlsx", "image"]).describe("Export format"),
    },
    async ({ object_id, format }) => {
      try {
        const result = await sessionManager.exportObject(object_id, format);
        return {
          content: [
            {
              type: "text",
              text: `Exported object ${object_id} as ${format}.\nDownload URL: ${result.downloadUrl}`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Take screenshot
  server.tool(
    "qlik_screenshot",
    "Take a screenshot of the current view or a specific object",
    {
      object_id: z.string().optional().describe("Optional: ID of specific object to capture"),
    },
    async ({ object_id }) => {
      try {
        const result = await sessionManager.takeScreenshot(object_id);
        const target = object_id ? `object ${object_id}` : "current view";
        return {
          content: [
            { type: "text", text: `Screenshot captured of ${target}.` },
            { type: "image", data: result.imageData, mimeType: "image/png" },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
