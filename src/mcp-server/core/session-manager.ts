/**
 * Qlik Session Manager
 *
 * Manages Qlik app sessions through the Chrome extension bridge.
 * Tracks open apps, objects, and handles session lifecycle.
 */

import { ExtensionBridge, QlikAppInfo, QlikSheetInfo, QlikObjectInfo } from "../bridge/extension-bridge.js";

export interface QlikSession {
  appId: string;
  appName: string;
  isConnected: boolean;
  sheets: QlikSheetInfo[];
  currentSheet?: string;
}

export interface SelectionState {
  fields: Array<{
    fieldName: string;
    selectedCount: number;
    totalCount: number;
    selections: string[];
  }>;
}

export interface HypercubeData {
  headers: string[];
  rows: Array<Array<string | number>>;
  totalRows: number;
}

export class QlikSessionManager {
  private sessions = new Map<string, QlikSession>();
  private currentAppId: string | null = null;
  private debug: boolean;

  constructor(private bridge: ExtensionBridge, debug = false) {
    this.debug = debug;

    // Listen for extension events
    bridge.on("app-opened", (data: { appId: string; appName: string }) => {
      this.log("App opened:", data);
      this.sessions.set(data.appId, {
        appId: data.appId,
        appName: data.appName,
        isConnected: true,
        sheets: [],
      });
      this.currentAppId = data.appId;
    });

    bridge.on("app-closed", (data: { appId: string }) => {
      this.log("App closed:", data);
      this.sessions.delete(data.appId);
      if (this.currentAppId === data.appId) {
        this.currentAppId = null;
      }
    });

    bridge.on("selection-changed", (data: SelectionState) => {
      this.log("Selection changed:", data);
    });
  }

  // Connection & App Management

  async getConnectionStatus(): Promise<{
    extensionConnected: boolean;
    currentApp: QlikAppInfo | null;
    qlikUrl: string | null;
  }> {
    if (!this.bridge.isConnected()) {
      return { extensionConnected: false, currentApp: null, qlikUrl: null };
    }
    return this.bridge.send("get-status");
  }

  async listApps(): Promise<QlikAppInfo[]> {
    return this.bridge.send("list-apps");
  }

  async openApp(appId: string): Promise<QlikSession> {
    const result = await this.bridge.send<{ appId: string; appName: string; sheets: QlikSheetInfo[] }>("open-app", { appId });

    const session: QlikSession = {
      appId: result.appId,
      appName: result.appName,
      isConnected: true,
      sheets: result.sheets,
    };

    this.sessions.set(appId, session);
    this.currentAppId = appId;
    return session;
  }

  async closeApp(appId?: string): Promise<void> {
    const targetAppId = appId || this.currentAppId;
    if (!targetAppId) {
      throw new Error("No app to close");
    }
    await this.bridge.send("close-app", { appId: targetAppId });
    this.sessions.delete(targetAppId);
    if (this.currentAppId === targetAppId) {
      this.currentAppId = null;
    }
  }

  async closeAll(): Promise<void> {
    for (const appId of this.sessions.keys()) {
      await this.closeApp(appId);
    }
  }

  // Navigation

  async getSheets(): Promise<QlikSheetInfo[]> {
    this.ensureAppOpen();
    return this.bridge.send("get-sheets");
  }

  async navigateToSheet(sheetId: string): Promise<void> {
    this.ensureAppOpen();
    await this.bridge.send("navigate-sheet", { sheetId });
    const session = this.sessions.get(this.currentAppId!);
    if (session) {
      session.currentSheet = sheetId;
    }
  }

  async getObjects(): Promise<QlikObjectInfo[]> {
    this.ensureAppOpen();
    return this.bridge.send("get-objects");
  }

  // Selections

  async getSelections(): Promise<SelectionState> {
    this.ensureAppOpen();
    return this.bridge.send("get-selections");
  }

  async selectValues(fieldName: string, values: (string | number)[]): Promise<void> {
    this.ensureAppOpen();
    await this.bridge.send("select-values", { fieldName, values });
  }

  async clearField(fieldName: string): Promise<void> {
    this.ensureAppOpen();
    await this.bridge.send("clear-field", { fieldName });
  }

  async clearAll(): Promise<void> {
    this.ensureAppOpen();
    await this.bridge.send("clear-all");
  }

  async lockField(fieldName: string): Promise<void> {
    this.ensureAppOpen();
    await this.bridge.send("lock-field", { fieldName });
  }

  async unlockField(fieldName: string): Promise<void> {
    this.ensureAppOpen();
    await this.bridge.send("unlock-field", { fieldName });
  }

  async forward(): Promise<void> {
    this.ensureAppOpen();
    await this.bridge.send("forward");
  }

  async back(): Promise<void> {
    this.ensureAppOpen();
    await this.bridge.send("back");
  }

  // Data Retrieval

  async getFieldValues(fieldName: string, maxValues = 100): Promise<string[]> {
    this.ensureAppOpen();
    return this.bridge.send("get-field-values", { fieldName, maxValues });
  }

  async getHypercubeData(objectId: string, options?: {
    top?: number;
    left?: number;
    height?: number;
    width?: number;
  }): Promise<HypercubeData> {
    this.ensureAppOpen();
    return this.bridge.send("get-hypercube-data", { objectId, ...options });
  }

  async evaluateExpression(expression: string): Promise<string | number> {
    this.ensureAppOpen();
    return this.bridge.send("evaluate-expression", { expression });
  }

  // Bookmarks

  async getBookmarks(): Promise<Array<{ id: string; title: string; description?: string }>> {
    this.ensureAppOpen();
    return this.bridge.send("get-bookmarks");
  }

  async applyBookmark(bookmarkId: string): Promise<void> {
    this.ensureAppOpen();
    await this.bridge.send("apply-bookmark", { bookmarkId });
  }

  async createBookmark(title: string, description?: string): Promise<string> {
    this.ensureAppOpen();
    return this.bridge.send("create-bookmark", { title, description });
  }

  // Variables

  async getVariables(): Promise<Array<{ name: string; value: string; definition?: string }>> {
    this.ensureAppOpen();
    return this.bridge.send("get-variables");
  }

  async setVariable(name: string, value: string): Promise<void> {
    this.ensureAppOpen();
    await this.bridge.send("set-variable", { name, value });
  }

  // Export

  async exportObject(objectId: string, format: "csv" | "xlsx" | "image"): Promise<{ downloadUrl: string }> {
    this.ensureAppOpen();
    return this.bridge.send("export-object", { objectId, format });
  }

  async takeScreenshot(objectId?: string): Promise<{ imageData: string }> {
    this.ensureAppOpen();
    return this.bridge.send("take-screenshot", { objectId });
  }

  // Data Model

  async getFields(includeSystem = false): Promise<any[]> {
    this.ensureAppOpen();
    return this.bridge.send("get-fields", { includeSystem });
  }

  async getTables(): Promise<any[]> {
    this.ensureAppOpen();
    return this.bridge.send("get-tables");
  }

  async getAssociations(): Promise<any[]> {
    this.ensureAppOpen();
    return this.bridge.send("get-associations");
  }

  async getTableSchema(tableName: string): Promise<any> {
    this.ensureAppOpen();
    return this.bridge.send("get-table-schema", { tableName });
  }

  async getMasterMeasures(): Promise<any[]> {
    this.ensureAppOpen();
    return this.bridge.send("get-master-measures");
  }

  async getMasterDimensions(): Promise<any[]> {
    this.ensureAppOpen();
    return this.bridge.send("get-master-dimensions");
  }

  async getObjectProperties(objectId: string): Promise<any> {
    this.ensureAppOpen();
    return this.bridge.send("get-object-properties", { objectId });
  }

  async getScript(): Promise<string> {
    this.ensureAppOpen();
    return this.bridge.send("get-script");
  }

  // Analysis

  async getTopN(dimension: string, expression: string, n: number, sort: string): Promise<any[]> {
    this.ensureAppOpen();
    return this.bridge.send("get-top-n", { dimension, expression, n, sort });
  }

  async getCrosstab(rowDim: string, colDim: string, expr: string, maxRows: number, maxCols: number): Promise<any> {
    this.ensureAppOpen();
    return this.bridge.send("get-crosstab", { rowDim, colDim, expr, maxRows, maxCols });
  }

  async detectDuplicates(fields: string[], minCount: number): Promise<any[]> {
    this.ensureAppOpen();
    return this.bridge.send("detect-duplicates", { fields, minCount });
  }

  async findOutliers(fieldName: string, dimension: string | undefined, method: string, threshold: number): Promise<any> {
    this.ensureAppOpen();
    return this.bridge.send("find-outliers", { fieldName, dimension, method, threshold });
  }

  async selectByExpression(fieldName: string, expression: string): Promise<number> {
    this.ensureAppOpen();
    return this.bridge.send("select-by-expression", { fieldName, expression });
  }

  async searchSelect(fieldName: string, searchTerm: string): Promise<number> {
    this.ensureAppOpen();
    return this.bridge.send("search-select", { fieldName, searchTerm });
  }

  async getRanking(dimension: string, expression: string, limit?: number): Promise<any[]> {
    this.ensureAppOpen();
    return this.bridge.send("get-ranking", { dimension, expression, limit });
  }

  // Helpers

  getCurrentSession(): QlikSession | null {
    if (!this.currentAppId) return null;
    return this.sessions.get(this.currentAppId) || null;
  }

  private ensureAppOpen(): void {
    // Only check extension connection, let the extension handle app state
    if (!this.bridge.isConnected()) {
      throw new Error("Chrome extension not connected.");
    }
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.error("[session]", ...args);
    }
  }
}
