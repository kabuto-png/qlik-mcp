/**
 * Content Script
 *
 * Runs in Qlik Sense pages and interacts with the Qlik Capability APIs.
 */
interface QlikApp {
    id: string;
    model: {
        id: string;
    };
    getAppLayout(): Promise<{
        qTitle: string;
    }>;
    field(name: string): QlikField;
    getObject(id: string): Promise<QlikObject>;
    createGenericObject(def: unknown): Promise<QlikObject>;
    destroySessionObject(id: string): Promise<void>;
    getList(type: string): Promise<{
        qAppObjectList: {
            qItems: unknown[];
        };
    }>;
    bookmark: {
        getList(): Promise<unknown[]>;
        apply(id: string): Promise<void>;
        create(title: string, description?: string): Promise<{
            id: string;
        }>;
    };
    variable: {
        getContent(name: string): Promise<{
            qContent: {
                qString: string;
            };
        }>;
        setStringValue(name: string, value: string): Promise<void>;
    };
    clearAll(): Promise<void>;
    forward(): Promise<void>;
    back(): Promise<void>;
}
interface QlikField {
    getData(options?: {
        rows?: number;
    }): Promise<{
        qDataPages: Array<{
            qMatrix: unknown[][];
        }>;
    }>;
    selectValues(values: Array<{
        qText?: string;
        qNumber?: number;
    }>, toggle?: boolean, softLock?: boolean): Promise<void>;
    clear(): Promise<void>;
    lock(): Promise<void>;
    unlock(): Promise<void>;
}
interface QlikObject {
    id: string;
    getLayout(): Promise<Record<string, unknown>>;
    getHyperCubeData(path: string, pages: Array<{
        qTop: number;
        qLeft: number;
        qWidth: number;
        qHeight: number;
    }>): Promise<unknown[]>;
    exportData(type: string, filename?: string): Promise<{
        qUrl: string;
    }>;
}
declare global {
    interface Window {
        require?: (deps: string[], callback: (...args: unknown[]) => void) => void;
        qlik?: {
            currApp(): QlikApp | null;
            openApp(appId: string): QlikApp;
            getAppList(callback: (list: Array<{
                qDocId: string;
                qTitle: string;
            }>) => void): void;
            navigation: {
                gotoSheet(sheetId: string): Promise<void>;
                getCurrentSheetId(): {
                    sheetId: string;
                };
            };
        };
    }
}
export {};
//# sourceMappingURL=content.d.ts.map