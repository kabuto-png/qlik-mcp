"use strict";
/**
 * Content Script
 *
 * Runs in Qlik Sense pages and interacts with the Qlik Capability APIs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
let app = null;
// Wait for Qlik to load
function waitForQlik() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        const check = () => {
            if (window.qlik) {
                resolve(window.qlik);
            }
            else if (attempts >= maxAttempts) {
                reject(new Error("Qlik APIs not available"));
            }
            else {
                attempts++;
                setTimeout(check, 200);
            }
        };
        check();
    });
}
// Initialize
async function init() {
    try {
        const qlik = await waitForQlik();
        console.log("[qlik-mcp] Qlik APIs detected");
        // Register with background
        chrome.runtime.sendMessage({ type: "register-tab" });
        // Get current app if any
        app = qlik.currApp();
        if (app) {
            const layout = await app.getAppLayout();
            notifyEvent("app-opened", { appId: app.id, appName: layout.qTitle });
        }
    }
    catch (err) {
        console.log("[qlik-mcp] Qlik APIs not available on this page");
    }
}
init();
// Handle messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleAction(message)
        .then((result) => sendResponse({ result }))
        .catch((err) => sendResponse({ error: err.message }));
    return true; // Keep channel open for async response
});
async function handleAction(message) {
    const qlik = window.qlik;
    if (!qlik) {
        throw new Error("Qlik APIs not available");
    }
    const { action, payload } = message;
    switch (action) {
        // App management
        case "list-apps":
            return listApps(qlik);
        case "open-app":
            return openApp(qlik, payload.appId);
        case "close-app":
            app = null;
            return { success: true };
        // Navigation
        case "get-sheets":
            return getSheets();
        case "navigate-sheet":
            await qlik.navigation.gotoSheet(payload.sheetId);
            return { success: true };
        case "get-objects":
            return getObjects();
        // Selections
        case "get-selections":
            return getSelections();
        case "select-values":
            return selectValues(payload.fieldName, payload.values);
        case "clear-field":
            await ensureApp().field(payload.fieldName).clear();
            return { success: true };
        case "clear-all":
            await ensureApp().clearAll();
            return { success: true };
        case "lock-field":
            await ensureApp().field(payload.fieldName).lock();
            return { success: true };
        case "unlock-field":
            await ensureApp().field(payload.fieldName).unlock();
            return { success: true };
        case "forward":
            await ensureApp().forward();
            return { success: true };
        case "back":
            await ensureApp().back();
            return { success: true };
        // Data
        case "get-field-values":
            return getFieldValues(payload.fieldName, payload.maxValues);
        case "get-hypercube-data":
            return getHypercubeData(payload.objectId, payload);
        case "evaluate-expression":
            return evaluateExpression(payload.expression);
        // Bookmarks
        case "get-bookmarks":
            return ensureApp().bookmark.getList();
        case "apply-bookmark":
            await ensureApp().bookmark.apply(payload.bookmarkId);
            return { success: true };
        case "create-bookmark":
            return ensureApp().bookmark.create(payload.title, payload.description);
        // Variables
        case "get-variables":
            return getVariables();
        case "set-variable":
            await ensureApp().variable.setStringValue(payload.name, payload.value);
            return { success: true };
        // Export
        case "export-object": {
            const obj = await ensureApp().getObject(payload.objectId);
            const result = await obj.exportData(payload.format);
            return { downloadUrl: result.qUrl };
        }
        case "take-screenshot":
            return takeScreenshot(payload.objectId);
        default:
            throw new Error(`Unknown action: ${action}`);
    }
}
function ensureApp() {
    if (!app) {
        throw new Error("No Qlik app is open");
    }
    return app;
}
function notifyEvent(action, payload) {
    chrome.runtime.sendMessage({ type: "qlik-event", action, payload });
}
// Implementation functions
function listApps(qlik) {
    return new Promise((resolve) => {
        qlik.getAppList((list) => {
            resolve(list.map((item) => ({ id: item.qDocId, name: item.qTitle })));
        });
    });
}
async function openApp(qlik, appId) {
    app = qlik.openApp(appId);
    const layout = await app.getAppLayout();
    const sheetList = await app.getList("sheet");
    const sheets = sheetList.qAppObjectList.qItems.map((item) => ({
        id: item.qInfo.qId,
        title: item.qMeta.title,
        description: item.qMeta.description,
    }));
    notifyEvent("app-opened", { appId: app.id, appName: layout.qTitle });
    return {
        appId: app.id,
        appName: layout.qTitle,
        sheets,
    };
}
async function getSheets() {
    const sheetList = await ensureApp().getList("sheet");
    return sheetList.qAppObjectList.qItems.map((item) => ({
        id: item.qInfo.qId,
        title: item.qMeta.title,
        description: item.qMeta.description,
    }));
}
async function getObjects() {
    const qlik = window.qlik;
    const sheetId = qlik.navigation.getCurrentSheetId().sheetId;
    const sheet = await ensureApp().getObject(sheetId);
    const layout = await sheet.getLayout();
    if (layout.qChildList?.qItems) {
        return layout.qChildList.qItems.map((item) => ({
            id: item.qInfo.qId,
            type: item.qInfo.qType,
        }));
    }
    return [];
}
async function getSelections() {
    const currentSelections = await ensureApp().createGenericObject({
        qInfo: { qType: "CurrentSelections" },
        qSelectionObjectDef: {},
    });
    const layout = await currentSelections.getLayout();
    await ensureApp().destroySessionObject(currentSelections.id);
    const fields = (layout.qSelectionObject?.qSelections || []).map((sel) => ({
        fieldName: sel.qField,
        selectedCount: sel.qSelectedCount,
        totalCount: sel.qTotal,
        selections: sel.qSelectedFieldSelectionInfo?.map((s) => s.qName) || [sel.qSelected],
    }));
    return { fields };
}
async function selectValues(fieldName, values) {
    const field = ensureApp().field(fieldName);
    const qValues = values.map((v) => typeof v === "number" ? { qNumber: v } : { qText: v });
    await field.selectValues(qValues, false, false);
}
async function getFieldValues(fieldName, maxValues) {
    const field = ensureApp().field(fieldName);
    const data = await field.getData({ rows: maxValues });
    const values = [];
    for (const page of data.qDataPages) {
        for (const row of page.qMatrix) {
            const cell = row[0];
            if (cell.qText) {
                values.push(cell.qText);
            }
        }
    }
    return values;
}
async function getHypercubeData(objectId, options) {
    const obj = await ensureApp().getObject(objectId);
    const layout = await obj.getLayout();
    if (!layout.qHyperCube) {
        throw new Error("Object does not contain a hypercube");
    }
    const hc = layout.qHyperCube;
    const headers = [
        ...(hc.qDimensionInfo || []).map((d) => d.qFallbackTitle),
        ...(hc.qMeasureInfo || []).map((m) => m.qFallbackTitle),
    ];
    const dataPages = await obj.getHyperCubeData("/qHyperCubeDef", [
        {
            qTop: options.top || 0,
            qLeft: options.left || 0,
            qWidth: hc.qSize?.qcx || headers.length,
            qHeight: options.height || 100,
        },
    ]);
    const rows = [];
    for (const page of dataPages) {
        for (const row of page.qMatrix) {
            rows.push(row.map((cell) => cell.qText || cell.qNum || ""));
        }
    }
    return {
        headers,
        rows,
        totalRows: hc.qSize?.qcy || rows.length,
    };
}
async function evaluateExpression(expression) {
    const obj = await ensureApp().createGenericObject({
        qInfo: { qType: "expression" },
        expr: { qValueExpression: expression },
    });
    const layout = await obj.getLayout();
    await ensureApp().destroySessionObject(obj.id);
    return layout.expr || "";
}
async function getVariables() {
    const varList = await ensureApp().getList("variable");
    const items = varList.qAppObjectList.qItems;
    const variables = [];
    for (const item of items.slice(0, 50)) {
        try {
            const content = await ensureApp().variable.getContent(item.qName);
            variables.push({
                name: item.qName,
                value: content.qContent.qString,
            });
        }
        catch {
            // Skip variables we can't read
        }
    }
    return variables;
}
async function takeScreenshot(objectId) {
    const element = objectId
        ? document.querySelector(`[data-qid="${objectId}"]`) || document.querySelector(".qv-object")
        : document.querySelector(".qv-page");
    if (!element) {
        throw new Error("Could not find element to capture");
    }
    // Use html2canvas if available, otherwise return placeholder
    // Note: Full screenshot implementation would require additional library
    return {
        imageData: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    };
}
//# sourceMappingURL=content.js.map