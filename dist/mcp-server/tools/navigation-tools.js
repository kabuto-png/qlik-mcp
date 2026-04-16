/**
 * Navigation Tools
 *
 * Tools for navigating within Qlik apps (sheets, objects).
 */
import { z } from "zod";
export function registerNavigationTools(server, sessionManager) {
    // Get sheets
    server.tool("qlik_get_sheets", "Get all sheets in the current Qlik app", {}, async () => {
        try {
            const sheets = await sessionManager.getSheets();
            if (sheets.length === 0) {
                return { content: [{ type: "text", text: "No sheets found." }] };
            }
            const text = sheets
                .map((sheet, i) => {
                let line = `${i + 1}. ${sheet.title} (${sheet.id})`;
                if (sheet.description) {
                    line += `\n   ${sheet.description}`;
                }
                return line;
            })
                .join("\n\n");
            return { content: [{ type: "text", text: `Sheets:\n\n${text}` }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Navigate to sheet
    server.tool("qlik_go_to_sheet", "Navigate to a specific sheet in the Qlik app", {
        sheet_id: z.string().describe("The sheet ID to navigate to"),
    }, async ({ sheet_id }) => {
        try {
            await sessionManager.navigateToSheet(sheet_id);
            return { content: [{ type: "text", text: `Navigated to sheet: ${sheet_id}` }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Get objects on current sheet
    server.tool("qlik_get_objects", "Get all visualization objects on the current sheet", {}, async () => {
        try {
            const objects = await sessionManager.getObjects();
            if (objects.length === 0) {
                return { content: [{ type: "text", text: "No objects found on current sheet." }] };
            }
            const text = objects
                .map((obj, i) => {
                let line = `${i + 1}. ${obj.title || "(untitled)"} [${obj.type}]`;
                line += `\n   ID: ${obj.id}`;
                return line;
            })
                .join("\n\n");
            return { content: [{ type: "text", text: `Objects on sheet:\n\n${text}` }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=navigation-tools.js.map