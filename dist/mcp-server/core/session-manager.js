/**
 * Qlik Session Manager
 *
 * Manages Qlik app sessions through the Chrome extension bridge.
 * Tracks open apps, objects, and handles session lifecycle.
 */
export class QlikSessionManager {
    bridge;
    sessions = new Map();
    currentAppId = null;
    debug;
    constructor(bridge, debug = false) {
        this.bridge = bridge;
        this.debug = debug;
        // Listen for extension events
        bridge.on("app-opened", (data) => {
            this.log("App opened:", data);
            this.sessions.set(data.appId, {
                appId: data.appId,
                appName: data.appName,
                isConnected: true,
                sheets: [],
            });
            this.currentAppId = data.appId;
        });
        bridge.on("app-closed", (data) => {
            this.log("App closed:", data);
            this.sessions.delete(data.appId);
            if (this.currentAppId === data.appId) {
                this.currentAppId = null;
            }
        });
        bridge.on("selection-changed", (data) => {
            this.log("Selection changed:", data);
        });
    }
    // Connection & App Management
    async getConnectionStatus() {
        if (!this.bridge.isConnected()) {
            return { extensionConnected: false, currentApp: null, qlikUrl: null };
        }
        return this.bridge.send("get-status");
    }
    async listApps() {
        return this.bridge.send("list-apps");
    }
    async openApp(appId) {
        const result = await this.bridge.send("open-app", { appId });
        const session = {
            appId: result.appId,
            appName: result.appName,
            isConnected: true,
            sheets: result.sheets,
        };
        this.sessions.set(appId, session);
        this.currentAppId = appId;
        return session;
    }
    async closeApp(appId) {
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
    async closeAll() {
        for (const appId of this.sessions.keys()) {
            await this.closeApp(appId);
        }
    }
    // Navigation
    async getSheets() {
        this.ensureAppOpen();
        return this.bridge.send("get-sheets");
    }
    async navigateToSheet(sheetId) {
        this.ensureAppOpen();
        await this.bridge.send("navigate-sheet", { sheetId });
        const session = this.sessions.get(this.currentAppId);
        if (session) {
            session.currentSheet = sheetId;
        }
    }
    async getObjects() {
        this.ensureAppOpen();
        return this.bridge.send("get-objects");
    }
    // Selections
    async getSelections() {
        this.ensureAppOpen();
        return this.bridge.send("get-selections");
    }
    async selectValues(fieldName, values) {
        this.ensureAppOpen();
        await this.bridge.send("select-values", { fieldName, values });
    }
    async clearField(fieldName) {
        this.ensureAppOpen();
        await this.bridge.send("clear-field", { fieldName });
    }
    async clearAll() {
        this.ensureAppOpen();
        await this.bridge.send("clear-all");
    }
    async lockField(fieldName) {
        this.ensureAppOpen();
        await this.bridge.send("lock-field", { fieldName });
    }
    async unlockField(fieldName) {
        this.ensureAppOpen();
        await this.bridge.send("unlock-field", { fieldName });
    }
    async forward() {
        this.ensureAppOpen();
        await this.bridge.send("forward");
    }
    async back() {
        this.ensureAppOpen();
        await this.bridge.send("back");
    }
    // Data Retrieval
    async getFieldValues(fieldName, maxValues = 100) {
        this.ensureAppOpen();
        return this.bridge.send("get-field-values", { fieldName, maxValues });
    }
    async getHypercubeData(objectId, options) {
        this.ensureAppOpen();
        return this.bridge.send("get-hypercube-data", { objectId, ...options });
    }
    async evaluateExpression(expression) {
        this.ensureAppOpen();
        return this.bridge.send("evaluate-expression", { expression });
    }
    // Bookmarks
    async getBookmarks() {
        this.ensureAppOpen();
        return this.bridge.send("get-bookmarks");
    }
    async applyBookmark(bookmarkId) {
        this.ensureAppOpen();
        await this.bridge.send("apply-bookmark", { bookmarkId });
    }
    async createBookmark(title, description) {
        this.ensureAppOpen();
        return this.bridge.send("create-bookmark", { title, description });
    }
    // Variables
    async getVariables() {
        this.ensureAppOpen();
        return this.bridge.send("get-variables");
    }
    async setVariable(name, value) {
        this.ensureAppOpen();
        await this.bridge.send("set-variable", { name, value });
    }
    // Export
    async exportObject(objectId, format) {
        this.ensureAppOpen();
        return this.bridge.send("export-object", { objectId, format });
    }
    async takeScreenshot(objectId) {
        this.ensureAppOpen();
        return this.bridge.send("take-screenshot", { objectId });
    }
    // Data Model
    async getFields(includeSystem = false) {
        this.ensureAppOpen();
        return this.bridge.send("get-fields", { includeSystem });
    }
    async getTables() {
        this.ensureAppOpen();
        return this.bridge.send("get-tables");
    }
    async getAssociations() {
        this.ensureAppOpen();
        return this.bridge.send("get-associations");
    }
    async getTableSchema(tableName) {
        this.ensureAppOpen();
        return this.bridge.send("get-table-schema", { tableName });
    }
    async getMasterMeasures() {
        this.ensureAppOpen();
        return this.bridge.send("get-master-measures");
    }
    async getMasterDimensions() {
        this.ensureAppOpen();
        return this.bridge.send("get-master-dimensions");
    }
    async getObjectProperties(objectId) {
        this.ensureAppOpen();
        return this.bridge.send("get-object-properties", { objectId });
    }
    async getScript() {
        this.ensureAppOpen();
        return this.bridge.send("get-script");
    }
    // Analysis
    async getTopN(dimension, expression, n, sort) {
        this.ensureAppOpen();
        return this.bridge.send("get-top-n", { dimension, expression, n, sort });
    }
    async getCrosstab(rowDim, colDim, expr, maxRows, maxCols) {
        this.ensureAppOpen();
        return this.bridge.send("get-crosstab", { rowDim, colDim, expr, maxRows, maxCols });
    }
    async detectDuplicates(fields, minCount) {
        this.ensureAppOpen();
        return this.bridge.send("detect-duplicates", { fields, minCount });
    }
    async findOutliers(fieldName, dimension, method, threshold) {
        this.ensureAppOpen();
        return this.bridge.send("find-outliers", { fieldName, dimension, method, threshold });
    }
    async selectByExpression(fieldName, expression) {
        this.ensureAppOpen();
        return this.bridge.send("select-by-expression", { fieldName, expression });
    }
    async searchSelect(fieldName, searchTerm) {
        this.ensureAppOpen();
        return this.bridge.send("search-select", { fieldName, searchTerm });
    }
    async getRanking(dimension, expression, limit) {
        this.ensureAppOpen();
        return this.bridge.send("get-ranking", { dimension, expression, limit });
    }
    // Helpers
    getCurrentSession() {
        if (!this.currentAppId)
            return null;
        return this.sessions.get(this.currentAppId) || null;
    }
    ensureAppOpen() {
        // Only check extension connection, let the extension handle app state
        if (!this.bridge.isConnected()) {
            throw new Error("Chrome extension not connected.");
        }
    }
    log(...args) {
        if (this.debug) {
            console.error("[session]", ...args);
        }
    }
}
//# sourceMappingURL=session-manager.js.map