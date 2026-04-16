/**
 * QC Tools - Data Quality & Verification
 *
 * Tools for autonomous data validation and quality checks in Qlik.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { QlikSessionManager } from "../core/session-manager.js";

export function registerQcTools(
  server: McpServer,
  sessionManager: QlikSessionManager
): void {
  // Verify a value exists in a field
  server.tool(
    "qlik_verify_value",
    "Check if a specific value exists in a Qlik field",
    {
      field_name: z.string().describe("Name of the field to search"),
      value: z.string().describe("Value to search for"),
      exact_match: z.boolean().optional().describe("Exact match (default: true)"),
    },
    async ({ field_name, value, exact_match = true }) => {
      try {
        const expression = exact_match
          ? `Count({<[${field_name}]={'${value}'}>} 1)`
          : `Count({<[${field_name}]={"*${value}*"}>} 1)`;
        const result = await sessionManager.evaluateExpression(expression);
        const count = parseInt(result as string) || 0;
        const exists = count > 0;
        return {
          content: [{
            type: "text",
            text: exists
              ? `Found: "${value}" exists in [${field_name}] (${count} records)`
              : `Not found: "${value}" does not exist in [${field_name}]`
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Compare two expressions
  server.tool(
    "qlik_compare",
    "Compare two Qlik expressions and check if they match",
    {
      expression1: z.string().describe("First expression (e.g., Sum(Sales))"),
      expression2: z.string().describe("Second expression to compare"),
      tolerance: z.number().optional().describe("Tolerance for numeric comparison (default: 0)"),
    },
    async ({ expression1, expression2, tolerance = 0 }) => {
      try {
        const [result1, result2] = await Promise.all([
          sessionManager.evaluateExpression(expression1),
          sessionManager.evaluateExpression(expression2),
        ]);

        const val1 = parseFloat(result1 as string);
        const val2 = parseFloat(result2 as string);
        const diff = Math.abs(val1 - val2);
        const match = diff <= tolerance;

        return {
          content: [{
            type: "text",
            text: `Comparison Result:
- Expression 1: ${expression1} = ${result1}
- Expression 2: ${expression2} = ${result2}
- Difference: ${diff}
- Match: ${match ? "YES" : "NO"}${tolerance > 0 ? ` (tolerance: ${tolerance})` : ""}`
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Count nulls/empty values
  server.tool(
    "qlik_count_nulls",
    "Count null or empty values in a field",
    {
      field_name: z.string().describe("Name of the field to check"),
    },
    async ({ field_name }) => {
      try {
        const [totalExpr, nullExpr, emptyExpr] = [
          `Count([${field_name}])`,
          `NullCount([${field_name}])`,
          `Count({<[${field_name}]={''}>} [${field_name}])`,
        ];

        const [total, nulls, empty] = await Promise.all([
          sessionManager.evaluateExpression(totalExpr),
          sessionManager.evaluateExpression(nullExpr),
          sessionManager.evaluateExpression(emptyExpr),
        ]);

        const totalVal = parseInt(total as string) || 0;
        const nullVal = parseInt(nulls as string) || 0;
        const emptyVal = parseInt(empty as string) || 0;
        const validVal = totalVal - nullVal - emptyVal;
        const qualityPct = totalVal > 0 ? ((validVal / totalVal) * 100).toFixed(1) : "N/A";

        return {
          content: [{
            type: "text",
            text: `Data Quality for [${field_name}]:
- Total records: ${totalVal}
- Null values: ${nullVal}
- Empty values: ${emptyVal}
- Valid values: ${validVal}
- Quality: ${qualityPct}%`
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Validate aggregation
  server.tool(
    "qlik_validate_sum",
    "Validate that a sum/aggregation matches expected value",
    {
      expression: z.string().describe("Aggregation expression (e.g., Sum(Amount))"),
      expected: z.number().describe("Expected value"),
      tolerance_pct: z.number().optional().describe("Tolerance percentage (default: 0.01 = 1%)"),
    },
    async ({ expression, expected, tolerance_pct = 0.01 }) => {
      try {
        const result = await sessionManager.evaluateExpression(expression);
        const actual = parseFloat(result as string);
        const diff = Math.abs(actual - expected);
        const diffPct = expected !== 0 ? (diff / Math.abs(expected)) * 100 : (actual === 0 ? 0 : 100);
        const valid = diffPct <= (tolerance_pct * 100);

        return {
          content: [{
            type: "text",
            text: `Validation: ${valid ? "PASS" : "FAIL"}
- Expression: ${expression}
- Expected: ${expected}
- Actual: ${actual}
- Difference: ${diff} (${diffPct.toFixed(2)}%)
- Tolerance: ${(tolerance_pct * 100).toFixed(1)}%`
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Search data across multiple fields
  server.tool(
    "qlik_search",
    "Search for a value across specified fields",
    {
      search_term: z.string().describe("Value to search for"),
      fields: z.array(z.string()).describe("List of field names to search"),
    },
    async ({ search_term, fields }) => {
      try {
        const results: string[] = [];

        for (const field of fields) {
          const expr = `Count({<[${field}]={"*${search_term}*"}>} 1)`;
          const count = await sessionManager.evaluateExpression(expr);
          const countVal = parseInt(count as string) || 0;
          if (countVal > 0) {
            results.push(`[${field}]: ${countVal} matches`);
          }
        }

        return {
          content: [{
            type: "text",
            text: results.length > 0
              ? `Search "${search_term}" found in:\n${results.join("\n")}`
              : `No matches found for "${search_term}" in specified fields`
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Get distinct count for a field
  server.tool(
    "qlik_distinct_count",
    "Get count of distinct values in a field",
    {
      field_name: z.string().describe("Name of the field"),
    },
    async ({ field_name }) => {
      try {
        const expr = `Count(DISTINCT [${field_name}])`;
        const result = await sessionManager.evaluateExpression(expr);
        return {
          content: [{
            type: "text",
            text: `Distinct values in [${field_name}]: ${result}`
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Get field statistics
  server.tool(
    "qlik_field_stats",
    "Get statistics for a numeric field (min, max, avg, sum)",
    {
      field_name: z.string().describe("Name of the numeric field"),
    },
    async ({ field_name }) => {
      try {
        const expressions = {
          min: `Min([${field_name}])`,
          max: `Max([${field_name}])`,
          avg: `Avg([${field_name}])`,
          sum: `Sum([${field_name}])`,
          count: `Count([${field_name}])`,
          distinct: `Count(DISTINCT [${field_name}])`,
        };

        const results = await Promise.all(
          Object.entries(expressions).map(async ([key, expr]) => {
            const val = await sessionManager.evaluateExpression(expr);
            return [key, val];
          })
        );

        const stats = Object.fromEntries(results);

        return {
          content: [{
            type: "text",
            text: `Statistics for [${field_name}]:
- Count: ${stats.count}
- Distinct: ${stats.distinct}
- Min: ${stats.min}
- Max: ${stats.max}
- Avg: ${stats.avg}
- Sum: ${stats.sum}`
          }],
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
