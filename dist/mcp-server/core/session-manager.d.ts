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
export declare class QlikSessionManager {
    private bridge;
    private sessions;
    private currentAppId;
    private debug;
    constructor(bridge: ExtensionBridge, debug?: boolean);
    getConnectionStatus(): Promise<{
        extensionConnected: boolean;
        currentApp: QlikAppInfo | null;
        qlikUrl: string | null;
    }>;
    listApps(): Promise<QlikAppInfo[]>;
    openApp(appId: string): Promise<QlikSession>;
    closeApp(appId?: string): Promise<void>;
    closeAll(): Promise<void>;
    getSheets(): Promise<QlikSheetInfo[]>;
    navigateToSheet(sheetId: string): Promise<void>;
    getObjects(): Promise<QlikObjectInfo[]>;
    getSelections(): Promise<SelectionState>;
    selectValues(fieldName: string, values: (string | number)[]): Promise<void>;
    clearField(fieldName: string): Promise<void>;
    clearAll(): Promise<void>;
    lockField(fieldName: string): Promise<void>;
    unlockField(fieldName: string): Promise<void>;
    forward(): Promise<void>;
    back(): Promise<void>;
    getFieldValues(fieldName: string, maxValues?: number): Promise<string[]>;
    getHypercubeData(objectId: string, options?: {
        top?: number;
        left?: number;
        height?: number;
        width?: number;
    }): Promise<HypercubeData>;
    evaluateExpression(expression: string): Promise<string | number>;
    getBookmarks(): Promise<Array<{
        id: string;
        title: string;
        description?: string;
    }>>;
    applyBookmark(bookmarkId: string): Promise<void>;
    createBookmark(title: string, description?: string): Promise<string>;
    getVariables(): Promise<Array<{
        name: string;
        value: string;
        definition?: string;
    }>>;
    setVariable(name: string, value: string): Promise<void>;
    exportObject(objectId: string, format: "csv" | "xlsx" | "image"): Promise<{
        downloadUrl: string;
    }>;
    takeScreenshot(objectId?: string): Promise<{
        imageData: string;
    }>;
    getFields(includeSystem?: boolean): Promise<any[]>;
    getTables(): Promise<any[]>;
    getAssociations(): Promise<any[]>;
    getTableSchema(tableName: string): Promise<any>;
    getMasterMeasures(): Promise<any[]>;
    getMasterDimensions(): Promise<any[]>;
    getObjectProperties(objectId: string): Promise<any>;
    getScript(): Promise<string>;
    getTopN(dimension: string, expression: string, n: number, sort: string): Promise<any[]>;
    getCrosstab(rowDim: string, colDim: string, expr: string, maxRows: number, maxCols: number): Promise<any>;
    detectDuplicates(fields: string[], minCount: number): Promise<any[]>;
    findOutliers(fieldName: string, dimension: string | undefined, method: string, threshold: number): Promise<any>;
    selectByExpression(fieldName: string, expression: string): Promise<number>;
    searchSelect(fieldName: string, searchTerm: string): Promise<number>;
    getRanking(dimension: string, expression: string, limit?: number): Promise<any[]>;
    getCurrentSession(): QlikSession | null;
    private ensureAppOpen;
    private log;
}
//# sourceMappingURL=session-manager.d.ts.map