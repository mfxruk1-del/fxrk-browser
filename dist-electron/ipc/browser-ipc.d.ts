import { BrowserWindow, BrowserView } from 'electron';
declare const tabViews: Map<string, BrowserView>;
declare let activeTabId: string | null;
export declare function registerBrowserIPC(mainWindow: BrowserWindow): void;
export { tabViews, activeTabId };
