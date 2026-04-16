/**
 * Analysis Tools
 *
 * Advanced analysis tools for BI developers.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { QlikSessionManager } from "../core/session-manager.js";

export function registerAnalysisTools(
  server: McpServer,
  sessionManager: QlikSessionManager
): void {
  // Top N analysis
  server.tool(
    "qlik_top_n",
    "Get top or bottom N values by an expression",
    {
      dimension: z.string().describe("Dimension field to group by"),
      expression: z.string().describe("Measure expression (e.g., Sum(Sales))"),
      n: z.number().optional().describe("Number of results (default: 10)"),
      sort: z.enum(["top", "bottom"]).optional().describe("Sort order (default: top)"),
    },
    async ({ dimension, expression, n = 10, sort = "top" }) => {
      try {
        const result = await sessionManager.getTopN(dimension, expression, n, sort);
        const rows = result.map((r: any, i: number) =>
          `${i + 1}. ${r.dimension}: ${r.value}`
        ).join("\n");
        return {
          content: [{ type: "text", text: `${sort === "top" ? "Top" : "Bottom"} ${n} by ${expression}:\n${rows}` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Cross-tab / Pivot analysis
  server.tool(
    "qlik_crosstab",
    "Create a cross-tab (pivot) analysis",
    {
      row_dimension: z.string().describe("Row dimension field"),
      col_dimension: z.string().describe("Column dimension field"),
      expression: z.string().describe("Measure expression"),
      max_rows: z.number().optional().describe("Max rows (default: 20)"),
      max_cols: z.number().optional().describe("Max columns (default: 10)"),
    },
    async ({ row_dimension, col_dimension, expression, max_rows = 20, max_cols = 10 }) => {
      try {
        const result = await sessionManager.getCrosstab(
          row_dimension, col_dimension, expression, max_rows, max_cols
        );
        // Format as markdown table
        const headers = ["", ...result.columns];
        const headerRow = `| ${headers.join(" | ")} |`;
        const separator = `|${headers.map(() => "---").join("|")}|`;
        const dataRows = result.rows.map((r: any) =>
          `| ${r.label} | ${r.values.join(" | ")} |`
        ).join("\n");
        return {
          content: [{ type: "text", text: `${headerRow}\n${separator}\n${dataRows}` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Detect duplicates
  server.tool(
    "qlik_detect_duplicates",
    "Find duplicate values in a field or field combination",
    {
      fields: z.array(z.string()).describe("Field(s) to check for duplicates"),
      min_count: z.number().optional().describe("Minimum occurrence count (default: 2)"),
    },
    async ({ fields, min_count = 2 }) => {
      try {
        const result = await sessionManager.detectDuplicates(fields, min_count);
        if (result.length === 0) {
          return {
            content: [{ type: "text", text: `No duplicates found (min count: ${min_count})` }],
          };
        }
        const rows = result.slice(0, 50).map((r: any) =>
          `- ${r.value}: ${r.count} occurrences`
        ).join("\n");
        const more = result.length > 50 ? `\n... and ${result.length - 50} more` : "";
        return {
          content: [{ type: "text", text: `Duplicates in [${fields.join(", ")}]:\n${rows}${more}` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Find outliers
  server.tool(
    "qlik_find_outliers",
    "Find statistical outliers in a numeric field",
    {
      field_name: z.string().describe("Numeric field to analyze"),
      dimension: z.string().optional().describe("Optional dimension to group by"),
      method: z.enum(["iqr", "zscore"]).optional().describe("Method: iqr (default) or zscore"),
      threshold: z.number().optional().describe("Threshold (IQR multiplier or z-score, default: 1.5 for IQR, 3 for zscore)"),
    },
    async ({ field_name, dimension, method = "iqr", threshold }) => {
      try {
        const defaultThreshold = method === "iqr" ? 1.5 : 3;
        const result = await sessionManager.findOutliers(
          field_name, dimension, method, threshold || defaultThreshold
        );
        if (result.outliers.length === 0) {
          return {
            content: [{ type: "text", text: `No outliers found in [${field_name}] using ${method} method` }],
          };
        }
        const stats = `Stats: min=${result.stats.min}, max=${result.stats.max}, avg=${result.stats.avg}`;
        const bounds = method === "iqr"
          ? `Bounds: [${result.stats.lowerBound}, ${result.stats.upperBound}]`
          : `Z-score threshold: ±${threshold || 3}`;
        const outliers = result.outliers.slice(0, 20).map((o: any) =>
          `- ${dimension ? o.dimension + ": " : ""}${o.value}`
        ).join("\n");
        return {
          content: [{ type: "text", text: `Outliers in [${field_name}]:\n${stats}\n${bounds}\n\n${outliers}` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Select by expression
  server.tool(
    "qlik_select_by_expression",
    "Select values in a field that match an expression condition",
    {
      field_name: z.string().describe("Field to select in"),
      expression: z.string().describe("Boolean expression (e.g., Sum(Sales) > 1000)"),
    },
    async ({ field_name, expression }) => {
      try {
        const count = await sessionManager.selectByExpression(field_name, expression);
        return {
          content: [{ type: "text", text: `Selected ${count} values in [${field_name}] where ${expression}` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Search and select
  server.tool(
    "qlik_search_select",
    "Search for values matching a pattern and select them",
    {
      field_name: z.string().describe("Field to search and select in"),
      search_term: z.string().describe("Search term (supports wildcards *)"),
    },
    async ({ field_name, search_term }) => {
      try {
        const count = await sessionManager.searchSelect(field_name, search_term);
        return {
          content: [{ type: "text", text: `Selected ${count} values matching "${search_term}" in [${field_name}]` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Rank analysis
  server.tool(
    "qlik_rank",
    "Get ranking of dimension values by expression",
    {
      dimension: z.string().describe("Dimension field"),
      expression: z.string().describe("Measure expression for ranking"),
      limit: z.number().optional().describe("Limit results (default: all)"),
    },
    async ({ dimension, expression, limit }) => {
      try {
        const result = await sessionManager.getRanking(dimension, expression, limit);
        const rows = result.map((r: any) =>
          `#${r.rank} ${r.dimension}: ${r.value}`
        ).join("\n");
        return {
          content: [{ type: "text", text: `Ranking by ${expression}:\n${rows}` }],
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
