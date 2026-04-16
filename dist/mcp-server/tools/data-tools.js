/**
 * Data Tools
 *
 * Tools for retrieving data from Qlik objects and fields.
 */
import { z } from "zod";
export function registerDataTools(server, sessionManager) {
    // Get field values
    server.tool("qlik_get_field_values", "Get distinct values from a field", {
        field_name: z.string().describe("Name of the field"),
        max_values: z.number().optional().default(100).describe("Maximum number of values to return"),
    }, async ({ field_name, max_values }) => {
        try {
            const values = await sessionManager.getFieldValues(field_name, max_values);
            if (values.length === 0) {
                return { content: [{ type: "text", text: `No values found in field: ${field_name}` }] };
            }
            const text = `Field: ${field_name}\nValues (${values.length}):\n${values.join(", ")}`;
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Get hypercube data from an object
    server.tool("qlik_get_data", "Get data from a Qlik visualization object (table, chart, etc.)", {
        object_id: z.string().describe("ID of the visualization object"),
        top: z.number().optional().default(0).describe("Starting row"),
        height: z.number().optional().default(100).describe("Number of rows to fetch"),
    }, async ({ object_id, top, height }) => {
        try {
            const data = await sessionManager.getHypercubeData(object_id, { top, height });
            if (data.rows.length === 0) {
                return { content: [{ type: "text", text: "No data in object." }] };
            }
            // Format as table
            const headerLine = data.headers.join(" | ");
            const separator = data.headers.map(() => "---").join(" | ");
            const rows = data.rows.map((row) => row.join(" | ")).join("\n");
            const text = `Data from object ${object_id}:\n\n${headerLine}\n${separator}\n${rows}\n\nTotal rows: ${data.totalRows}`;
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Evaluate expression
    server.tool("qlik_evaluate", "Evaluate a Qlik expression and return the result", {
        expression: z.string().describe("Qlik expression to evaluate (e.g., 'Sum(Sales)')"),
    }, async ({ expression }) => {
        try {
            const result = await sessionManager.evaluateExpression(expression);
            return { content: [{ type: "text", text: `Expression: ${expression}\nResult: ${result}` }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Get variables
    server.tool("qlik_get_variables", "Get all variables in the Qlik app", {}, async () => {
        try {
            const variables = await sessionManager.getVariables();
            if (variables.length === 0) {
                return { content: [{ type: "text", text: "No variables found." }] };
            }
            const text = variables
                .map((v) => {
                let line = `${v.name}: ${v.value}`;
                if (v.definition) {
                    line += `\n  Definition: ${v.definition}`;
                }
                return line;
            })
                .join("\n\n");
            return { content: [{ type: "text", text: `Variables:\n\n${text}` }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Set variable
    server.tool("qlik_set_variable", "Set a variable value in the Qlik app", {
        name: z.string().describe("Variable name"),
        value: z.string().describe("New value for the variable"),
    }, async ({ name, value }) => {
        try {
            await sessionManager.setVariable(name, value);
            return { content: [{ type: "text", text: `Set variable ${name} = ${value}` }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=data-tools.js.map