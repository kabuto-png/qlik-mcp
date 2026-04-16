/**
 * Data Model Tools
 *
 * Tools for exploring Qlik data model structure.
 */
import { z } from "zod";
export function registerModelTools(server, sessionManager) {
    // Get all fields in data model
    server.tool("qlik_get_fields", "Get all fields in the Qlik data model", {
        include_system: z.boolean().optional().describe("Include system fields (default: false)"),
    }, async ({ include_system = false }) => {
        try {
            const fields = await sessionManager.getFields(include_system);
            const text = fields.map((f) => `- ${f.name} [${f.tags?.join(", ") || "no tags"}] (${f.cardinal} values)`).join("\n");
            return {
                content: [{ type: "text", text: `Fields (${fields.length}):\n${text}` }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Get all tables
    server.tool("qlik_get_tables", "Get all tables in the Qlik data model with row counts", {}, async () => {
        try {
            const tables = await sessionManager.getTables();
            const text = tables.map((t) => `- ${t.name}: ${t.rows} rows, ${t.fields} fields, ${t.keyFields} keys`).join("\n");
            return {
                content: [{ type: "text", text: `Tables (${tables.length}):\n${text}` }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Get table associations
    server.tool("qlik_get_associations", "Get associations (links) between tables in the data model", {}, async () => {
        try {
            const assoc = await sessionManager.getAssociations();
            const text = assoc.map((a) => `- ${a.table1} <-> ${a.table2} via [${a.keyField}]`).join("\n");
            return {
                content: [{ type: "text", text: `Associations (${assoc.length}):\n${text}` }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Get table schema (fields in a table)
    server.tool("qlik_get_table_schema", "Get schema (fields) for a specific table", {
        table_name: z.string().describe("Name of the table"),
    }, async ({ table_name }) => {
        try {
            const schema = await sessionManager.getTableSchema(table_name);
            const text = schema.fields.map((f) => `- ${f.name}: ${f.type || "unknown"} (${f.distinct} distinct)`).join("\n");
            return {
                content: [{ type: "text", text: `Table: ${table_name}\nRows: ${schema.rows}\nFields:\n${text}` }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Get master measures
    server.tool("qlik_get_measures", "Get all master measures with their definitions", {}, async () => {
        try {
            const measures = await sessionManager.getMasterMeasures();
            const text = measures.map((m) => `- ${m.title}: ${m.expression}\n  ${m.description || ""}`).join("\n");
            return {
                content: [{ type: "text", text: `Master Measures (${measures.length}):\n${text}` }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Get master dimensions
    server.tool("qlik_get_dimensions", "Get all master dimensions with their definitions", {}, async () => {
        try {
            const dims = await sessionManager.getMasterDimensions();
            const text = dims.map((d) => `- ${d.title}: ${d.field || d.expression}\n  ${d.description || ""}`).join("\n");
            return {
                content: [{ type: "text", text: `Master Dimensions (${dims.length}):\n${text}` }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Get object properties/metadata
    server.tool("qlik_get_object_props", "Get properties and metadata for a visualization object", {
        object_id: z.string().describe("ID of the object"),
    }, async ({ object_id }) => {
        try {
            const props = await sessionManager.getObjectProperties(object_id);
            return {
                content: [{ type: "text", text: JSON.stringify(props, null, 2) }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Get load script
    server.tool("qlik_get_script", "Get the data load script (if accessible)", {}, async () => {
        try {
            const script = await sessionManager.getScript();
            const text = typeof script === "string" ? script : JSON.stringify(script, null, 2);
            return {
                content: [{ type: "text", text: text || "Script not accessible or empty" }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=model-tools.js.map