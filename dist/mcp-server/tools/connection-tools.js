/**
 * Connection Tools
 *
 * Tools for connecting to Qlik and managing app sessions.
 */
import { z } from "zod";
export function registerConnectionTools(server, sessionManager, bridge) {
    // Get connection status
    server.tool("qlik_status", "Get current connection status to Qlik Sense via Chrome extension", {}, async () => {
        try {
            const status = await sessionManager.getConnectionStatus();
            const currentSession = sessionManager.getCurrentSession();
            let text = `Extension Connected: ${status.extensionConnected}\n`;
            if (status.qlikUrl) {
                text += `Qlik URL: ${status.qlikUrl}\n`;
            }
            if (status.currentApp) {
                text += `Current App: ${status.currentApp.name} (${status.currentApp.id})\n`;
            }
            if (currentSession) {
                text += `Sheets: ${currentSession.sheets.length}\n`;
                if (currentSession.currentSheet) {
                    text += `Current Sheet: ${currentSession.currentSheet}\n`;
                }
            }
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // List available apps
    server.tool("qlik_list_apps", "List all available Qlik Sense apps", {}, async () => {
        try {
            const apps = await sessionManager.listApps();
            if (apps.length === 0) {
                return { content: [{ type: "text", text: "No apps found." }] };
            }
            const text = apps
                .map((app, i) => `${i + 1}. ${app.name}\n   ID: ${app.id}`)
                .join("\n\n");
            return { content: [{ type: "text", text: `Available Apps:\n\n${text}` }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Open an app
    server.tool("qlik_open_app", "Open a Qlik Sense app by ID", {
        app_id: z.string().describe("The app ID to open"),
    }, async ({ app_id }) => {
        try {
            const session = await sessionManager.openApp(app_id);
            let text = `Opened app: ${session.appName}\n`;
            text += `App ID: ${session.appId}\n`;
            text += `Sheets: ${session.sheets.length}\n`;
            if (session.sheets.length > 0) {
                text += "\nAvailable sheets:\n";
                session.sheets.forEach((sheet, i) => {
                    text += `  ${i + 1}. ${sheet.title} (${sheet.id})\n`;
                });
            }
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Close current app
    server.tool("qlik_close_app", "Close the current Qlik Sense app", {
        app_id: z.string().optional().describe("Specific app ID to close (defaults to current)"),
    }, async ({ app_id }) => {
        try {
            await sessionManager.closeApp(app_id);
            return { content: [{ type: "text", text: "App closed successfully." }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=connection-tools.js.map