/**
 * Bookmark Tools
 *
 * Tools for managing Qlik bookmarks.
 */
import { z } from "zod";
export function registerBookmarkTools(server, sessionManager) {
    // Get bookmarks
    server.tool("qlik_get_bookmarks", "Get all bookmarks in the Qlik app", {}, async () => {
        try {
            const bookmarks = await sessionManager.getBookmarks();
            if (bookmarks.length === 0) {
                return { content: [{ type: "text", text: "No bookmarks found." }] };
            }
            const text = bookmarks
                .map((bm, i) => {
                let line = `${i + 1}. ${bm.title} (${bm.id})`;
                if (bm.description) {
                    line += `\n   ${bm.description}`;
                }
                return line;
            })
                .join("\n\n");
            return { content: [{ type: "text", text: `Bookmarks:\n\n${text}` }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Apply bookmark
    server.tool("qlik_apply_bookmark", "Apply a bookmark to restore saved selections", {
        bookmark_id: z.string().describe("ID of the bookmark to apply"),
    }, async ({ bookmark_id }) => {
        try {
            await sessionManager.applyBookmark(bookmark_id);
            return { content: [{ type: "text", text: `Applied bookmark: ${bookmark_id}` }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Create bookmark
    server.tool("qlik_create_bookmark", "Create a new bookmark with current selections", {
        title: z.string().describe("Title for the bookmark"),
        description: z.string().optional().describe("Optional description"),
    }, async ({ title, description }) => {
        try {
            const id = await sessionManager.createBookmark(title, description);
            return { content: [{ type: "text", text: `Created bookmark: ${title} (${id})` }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=bookmark-tools.js.map