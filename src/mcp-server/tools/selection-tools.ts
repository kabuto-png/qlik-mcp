/**
 * Selection Tools
 *
 * Tools for making and managing selections in Qlik.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { QlikSessionManager } from "../core/session-manager.js";

export function registerSelectionTools(
  server: McpServer,
  sessionManager: QlikSessionManager
): void {
  // Get current selections
  server.tool(
    "qlik_get_selections",
    "Get current selections in the Qlik app",
    {},
    async () => {
      try {
        const state = await sessionManager.getSelections();
        if (state.fields.length === 0) {
          return { content: [{ type: "text", text: "No active selections." }] };
        }

        const text = state.fields
          .map((field) => {
            const selectionText = field.selections.slice(0, 5).join(", ");
            const more = field.selections.length > 5 ? ` (+${field.selections.length - 5} more)` : "";
            return `${field.fieldName}: ${selectionText}${more}\n  Selected: ${field.selectedCount} / ${field.totalCount}`;
          })
          .join("\n\n");

        return { content: [{ type: "text", text: `Current Selections:\n\n${text}` }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Select values in a field
  server.tool(
    "qlik_select",
    "Select specific values in a Qlik field",
    {
      field_name: z.string().describe("Name of the field to select in"),
      values: z.array(z.union([z.string(), z.number()])).describe("Values to select"),
    },
    async ({ field_name, values }) => {
      try {
        await sessionManager.selectValues(field_name, values);
        return {
          content: [{ type: "text", text: `Selected ${values.length} value(s) in field: ${field_name}` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Clear field selections
  server.tool(
    "qlik_clear_field",
    "Clear selections in a specific field",
    {
      field_name: z.string().describe("Name of the field to clear"),
    },
    async ({ field_name }) => {
      try {
        await sessionManager.clearField(field_name);
        return { content: [{ type: "text", text: `Cleared selections in field: ${field_name}` }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Clear all selections
  server.tool(
    "qlik_clear_all",
    "Clear all selections in the Qlik app",
    {},
    async () => {
      try {
        await sessionManager.clearAll();
        return { content: [{ type: "text", text: "All selections cleared." }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Lock field
  server.tool(
    "qlik_lock_field",
    "Lock selections in a field to prevent changes",
    {
      field_name: z.string().describe("Name of the field to lock"),
    },
    async ({ field_name }) => {
      try {
        await sessionManager.lockField(field_name);
        return { content: [{ type: "text", text: `Locked field: ${field_name}` }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Unlock field
  server.tool(
    "qlik_unlock_field",
    "Unlock a previously locked field",
    {
      field_name: z.string().describe("Name of the field to unlock"),
    },
    async ({ field_name }) => {
      try {
        await sessionManager.unlockField(field_name);
        return { content: [{ type: "text", text: `Unlocked field: ${field_name}` }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Forward in selection history
  server.tool(
    "qlik_forward",
    "Go forward in selection history",
    {},
    async () => {
      try {
        await sessionManager.forward();
        return { content: [{ type: "text", text: "Moved forward in selection history." }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Back in selection history
  server.tool(
    "qlik_back",
    "Go back in selection history",
    {},
    async () => {
      try {
        await sessionManager.back();
        return { content: [{ type: "text", text: "Moved back in selection history." }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
