"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeTabId = exports.tabViews = void 0;
exports.registerBrowserIPC = registerBrowserIPC;
const electron_1 = require("electron");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const DatabaseService_1 = require("../services/DatabaseService");
const PrivacyEngine_1 = require("../services/PrivacyEngine");
const ContainerService_1 = require("../services/ContainerService");
const validators_1 = require("../utils/validators");
const constants_1 = require("../utils/constants");
// ============================================================
// FXRK Browser - Browser IPC Handlers
// Handles tab management, navigation, bookmarks, history,
// downloads, zoom, find-in-page, and DevTools.
// ============================================================
// Map of BrowserViews indexed by tab ID
const tabViews = new Map();
exports.tabViews = tabViews;
// Currently active tab ID per window
let activeTabId = null;
exports.activeTabId = activeTabId;
// Map of find-in-page request IDs
const findInPageActive = new Map();
function registerBrowserIPC(mainWindow) {
    // ── Tab Management ────────────────────────────────────────
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.TAB_CREATE, async (_, opts = {}) => {
        const id = (0, uuid_1.v4)();
        const url = (0, validators_1.normalizeInput)(opts.url || constants_1.DEFAULT_HOME_PAGE);
        const profileId = opts.profileId || 'default';
        const containerId = opts.containerId ?? null;
        const partition = ContainerService_1.containerService.getPartition(containerId, profileId);
        const view = new electron_1.BrowserView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
                partition,
                preload: path_1.default.join(__dirname, '../../dist-electron/preload.js'),
                allowRunningInsecureContent: false,
                webSecurity: true,
                navigateOnDragDrop: false,
            },
        });
        tabViews.set(id, view);
        // Initialize privacy engine for this session if not already done
        await PrivacyEngine_1.privacyEngine.initialize(view.webContents.session);
        // Inject fingerprint spoofer as a preload script content
        const spoofScript = PrivacyEngine_1.privacyEngine.buildFingerprintSpooferScript();
        view.webContents.session.setPreloads([
            path_1.default.join(__dirname, '../../dist-electron/preload.js'),
        ]);
        // Track navigation events
        view.webContents.on('did-navigate', (_, url) => {
            PrivacyEngine_1.privacyEngine.updateTabDomain(view.webContents.id, url);
            PrivacyEngine_1.privacyEngine.resetBlockedCount(view.webContents.id);
            mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, {
                id,
                url,
                title: view.webContents.getTitle(),
                isLoading: false,
                canGoBack: view.webContents.canGoBack(),
                canGoForward: view.webContents.canGoForward(),
            });
            // Record in history (skip internal pages)
            if (!url.startsWith('fxrk://') && url !== 'about:blank') {
                DatabaseService_1.db.addHistory({
                    id: (0, uuid_1.v4)(),
                    url,
                    title: view.webContents.getTitle(),
                    favicon: '',
                    visitedAt: Date.now(),
                    visitCount: 1,
                    profileId,
                });
            }
        });
        view.webContents.on('did-start-loading', () => {
            mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, { id, isLoading: true });
        });
        view.webContents.on('did-stop-loading', () => {
            mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, {
                id,
                isLoading: false,
                title: view.webContents.getTitle(),
                url: view.webContents.getURL(),
            });
        });
        view.webContents.on('page-title-updated', (_, title) => {
            mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, { id, title });
        });
        view.webContents.on('page-favicon-updated', (_, favicons) => {
            if (favicons.length > 0) {
                mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, { id, favicon: favicons[0] });
            }
        });
        view.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
            mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, {
                id, isLoading: false, errorCode, errorDescription,
            });
        });
        // Inject fingerprint spoofer before page scripts run
        view.webContents.on('dom-ready', () => {
            view.webContents.executeJavaScript(spoofScript).catch(() => { });
        });
        // Handle downloads
        view.webContents.session.on('will-download', (_, item) => {
            const downloadId = (0, uuid_1.v4)();
            const defaultPath = path_1.default.join(DatabaseService_1.db.getSetting('downloadPath', process.env.USERPROFILE
                ? path_1.default.join(process.env.USERPROFILE, 'Downloads')
                : '.'), item.getFilename());
            item.setSavePath(defaultPath);
            const download = {
                id: downloadId,
                url: item.getURL(),
                filename: item.getFilename(),
                savePath: defaultPath,
                totalBytes: item.getTotalBytes(),
                receivedBytes: 0,
                state: 'progressing',
                paused: false,
                startedAt: Date.now(),
                mimeType: item.getMimeType(),
            };
            DatabaseService_1.db.saveDownload(download);
            mainWindow.webContents.send(constants_1.IPC_CHANNELS.DOWNLOAD_ITEM, download);
            item.on('updated', (_, state) => {
                const update = {
                    ...download,
                    receivedBytes: item.getReceivedBytes(),
                    totalBytes: item.getTotalBytes(),
                    state: state === 'interrupted' ? 'interrupted' : 'progressing',
                    paused: item.isPaused(),
                    speed: 0,
                };
                DatabaseService_1.db.updateDownloadProgress(downloadId, item.getReceivedBytes(), update.state);
                mainWindow.webContents.send(constants_1.IPC_CHANNELS.DOWNLOAD_ITEM, update);
            });
            item.on('done', (_, state) => {
                const finalState = state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted';
                DatabaseService_1.db.updateDownloadProgress(downloadId, item.getReceivedBytes(), finalState);
                mainWindow.webContents.send(constants_1.IPC_CHANNELS.DOWNLOAD_ITEM, {
                    ...download,
                    receivedBytes: item.getReceivedBytes(),
                    state: finalState,
                    completedAt: Date.now(),
                });
            });
        });
        // Navigate to initial URL
        if (!opts.background) {
            exports.activeTabId = activeTabId = id;
            attachView(mainWindow, view);
        }
        if (url !== constants_1.DEFAULT_HOME_PAGE && !url.startsWith('fxrk://')) {
            await view.webContents.loadURL(url).catch(err => logger_1.logger.browser.warn(`Failed to load ${url}: ${err}`));
        }
        return {
            id,
            url,
            title: 'New Tab',
            favicon: '',
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            isActive: !opts.background,
            isPinned: false,
            isMuted: false,
            containerId,
            profileId,
            zoomLevel: DatabaseService_1.db.getSiteZoom((0, validators_1.extractDomain)(url)),
            scrollPosition: { x: 0, y: 0 },
        };
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.TAB_SWITCH, (_, tabId) => {
        const view = tabViews.get(tabId);
        if (!view)
            return false;
        exports.activeTabId = activeTabId = tabId;
        attachView(mainWindow, view);
        return true;
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.TAB_CLOSE, (_, tabId) => {
        const view = tabViews.get(tabId);
        if (!view)
            return;
        // Track for "reopen closed tab" feature
        DatabaseService_1.db.pushClosedTab({
            id: tabId,
            url: view.webContents.getURL(),
            title: view.webContents.getTitle(),
            favicon: '',
            profileId: 'default',
        });
        mainWindow.removeBrowserView(view);
        view.webContents.close();
        tabViews.delete(tabId);
        if (activeTabId === tabId) {
            exports.activeTabId = activeTabId = null;
        }
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.TAB_PIN, (_, tabId, pinned) => {
        mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, { id: tabId, isPinned: pinned });
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.TAB_MUTE, (_, tabId, muted) => {
        const view = tabViews.get(tabId);
        if (!view)
            return;
        view.webContents.setAudioMuted(muted);
        mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, { id: tabId, isMuted: muted });
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.TAB_DUPLICATE, async (_, tabId) => {
        const view = tabViews.get(tabId);
        if (!view)
            return null;
        const url = view.webContents.getURL();
        // Create new tab with same URL (handled recursively via TAB_CREATE)
        return { url };
    });
    // ── Navigation ────────────────────────────────────────────
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.NAVIGATE, async (_, tabId, url) => {
        const view = tabViews.get(tabId);
        if (!view)
            return false;
        const normalized = (0, validators_1.normalizeInput)(url, DatabaseService_1.db.getSetting('searchEngine', 'https://duckduckgo.com/?q=%s'));
        if (normalized.startsWith('fxrk://')) {
            // Internal page — notify renderer to show it
            mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, {
                id: tabId,
                url: normalized,
                title: normalized.replace('fxrk://', '').toUpperCase(),
                isLoading: false,
            });
            return true;
        }
        await view.webContents.loadURL(normalized).catch(err => logger_1.logger.browser.warn(`Navigation error: ${err}`));
        return true;
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.NAVIGATE_BACK, (_, tabId) => {
        tabViews.get(tabId)?.webContents.goBack();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.NAVIGATE_FORWARD, (_, tabId) => {
        tabViews.get(tabId)?.webContents.goForward();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.NAVIGATE_REFRESH, (_, tabId) => {
        tabViews.get(tabId)?.webContents.reload();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.NAVIGATE_STOP, (_, tabId) => {
        tabViews.get(tabId)?.webContents.stop();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.NAVIGATE_HOME, (_, tabId) => {
        const homeUrl = DatabaseService_1.db.getSetting('homePage', 'fxrk://newtab');
        mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, {
            id: tabId,
            url: homeUrl,
            title: 'Home',
            isLoading: false,
        });
    });
    // ── Find in Page ──────────────────────────────────────────
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.FIND_IN_PAGE, (_, tabId, query, options = {}) => {
        const view = tabViews.get(tabId);
        if (!view)
            return;
        view.webContents.findInPage(query, {
            forward: options.forward !== false,
            findNext: options.findNext || false,
            matchCase: options.matchCase || false,
        });
        view.webContents.once('found-in-page', (_, result) => {
            mainWindow.webContents.send('find:result', {
                tabId,
                activeMatchOrdinal: result.activeMatchOrdinal,
                matches: result.matches,
            });
        });
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.FIND_STOP, (_, tabId) => {
        tabViews.get(tabId)?.webContents.stopFindInPage('clearSelection');
    });
    // ── DevTools ──────────────────────────────────────────────
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.DEVTOOLS_OPEN, (_, tabId) => {
        const view = tabViews.get(tabId);
        if (!view)
            return;
        if (view.webContents.isDevToolsOpened()) {
            view.webContents.closeDevTools();
        }
        else {
            view.webContents.openDevTools({ mode: 'detach' });
        }
    });
    // ── Screenshot ────────────────────────────────────────────
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SCREENSHOT_CAPTURE, async (_, tabId, type = 'visible') => {
        const view = tabViews.get(tabId);
        if (!view)
            return null;
        const image = await view.webContents.capturePage();
        const pngBuffer = image.toPNG();
        const base64 = pngBuffer.toString('base64');
        return `data:image/png;base64,${base64}`;
    });
    // ── Bookmarks ─────────────────────────────────────────────
    electron_1.ipcMain.handle('bookmarks:get', (_, profileId) => DatabaseService_1.db.getBookmarks(profileId));
    electron_1.ipcMain.handle('bookmarks:add', (_, bookmark) => {
        DatabaseService_1.db.addBookmark(bookmark);
        return bookmark;
    });
    electron_1.ipcMain.handle('bookmarks:delete', (_, id) => DatabaseService_1.db.deleteBookmark(id));
    electron_1.ipcMain.handle('bookmarks:isBookmarked', (_, url, profileId) => DatabaseService_1.db.isBookmarked(url, profileId));
    electron_1.ipcMain.handle('bookmarks:getFolders', (_, profileId) => DatabaseService_1.db.getBookmarkFolders(profileId));
    electron_1.ipcMain.handle('bookmarks:addFolder', (_, folder) => {
        DatabaseService_1.db.addBookmarkFolder(folder);
        return folder;
    });
    // ── History ───────────────────────────────────────────────
    electron_1.ipcMain.handle('history:get', (_, profileId, limit, offset) => DatabaseService_1.db.getHistory(profileId, limit, offset));
    electron_1.ipcMain.handle('history:search', (_, profileId, query) => DatabaseService_1.db.searchHistory(profileId, query));
    electron_1.ipcMain.handle('history:clear', (_, profileId, before) => DatabaseService_1.db.clearHistory(profileId, before));
    electron_1.ipcMain.handle('history:delete', (_, id) => DatabaseService_1.db.deleteHistoryEntry(id));
    // ── Downloads ─────────────────────────────────────────────
    electron_1.ipcMain.handle('downloads:get', () => DatabaseService_1.db.getDownloads());
    electron_1.ipcMain.handle('downloads:open', (_, savePath) => {
        electron_1.shell.openPath(savePath);
    });
    electron_1.ipcMain.handle('downloads:openFolder', (_, savePath) => {
        electron_1.shell.showItemInFolder(savePath);
    });
    // ── Zoom ──────────────────────────────────────────────────
    electron_1.ipcMain.handle('zoom:set', (_, tabId, level) => {
        const view = tabViews.get(tabId);
        if (!view)
            return;
        view.webContents.setZoomFactor(level);
        const domain = (0, validators_1.extractDomain)(view.webContents.getURL());
        DatabaseService_1.db.setSiteZoom(domain, level);
        mainWindow.webContents.send(constants_1.IPC_CHANNELS.TAB_UPDATE, { id: tabId, zoomLevel: level });
    });
    electron_1.ipcMain.handle('zoom:get', (_, tabId) => {
        const view = tabViews.get(tabId);
        return view?.webContents.getZoomFactor() ?? 1.0;
    });
    // ── Window Controls ───────────────────────────────────────
    electron_1.ipcMain.on(constants_1.IPC_CHANNELS.WINDOW_MINIMIZE, () => mainWindow.minimize());
    electron_1.ipcMain.on(constants_1.IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow.maximize();
        }
    });
    electron_1.ipcMain.on(constants_1.IPC_CHANNELS.WINDOW_CLOSE, () => mainWindow.close());
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => mainWindow.isMaximized());
    // ── Layout: BrowserView position update ──────────────────
    // Called when toolbar/tabs layout changes so webview is repositioned
    electron_1.ipcMain.on('layout:viewBounds', (_, bounds) => {
        const view = activeTabId ? tabViews.get(activeTabId) : null;
        if (view) {
            view.setBounds(bounds);
        }
    });
    // ── Notes ─────────────────────────────────────────────────
    electron_1.ipcMain.handle('notes:get', (_, url, profileId) => DatabaseService_1.db.getNote(url, profileId));
    electron_1.ipcMain.handle('notes:save', (_, note) => DatabaseService_1.db.saveNote(note));
    electron_1.ipcMain.handle('notes:delete', (_, id) => DatabaseService_1.db.deleteNote(id));
    // ── Session Save/Restore ──────────────────────────────────
    electron_1.ipcMain.handle('session:save', (_, tabs, profileId) => {
        DatabaseService_1.db.saveSession('last', 'Last Session', JSON.stringify(tabs.map(t => ({
            url: t.url, title: t.title, containerId: t.containerId
        }))), profileId);
    });
    electron_1.ipcMain.handle('session:restore', (_, profileId) => DatabaseService_1.db.getLastSession(profileId));
    electron_1.ipcMain.handle('session:closedTabPop', (_, profileId) => DatabaseService_1.db.popClosedTab(profileId));
    // ── Clipboard ─────────────────────────────────────────────
    electron_1.ipcMain.handle('clipboard:write', (_, text) => electron_1.clipboard.writeText(text));
    electron_1.ipcMain.handle('clipboard:read', () => electron_1.clipboard.readText());
    // ── Privacy Blocked Count (per tab) ──────────────────────
    electron_1.ipcMain.handle('privacy:blockedForTab', (_, tabId) => {
        const view = tabViews.get(tabId);
        if (!view)
            return 0;
        return PrivacyEngine_1.privacyEngine.getBlockedCount(view.webContents.id);
    });
    logger_1.logger.browser.info('Browser IPC handlers registered');
}
/** Attach a BrowserView to the window and set its bounds */
function attachView(win, view) {
    // Remove all existing views first
    for (const existingView of win.getBrowserViews()) {
        win.removeBrowserView(existingView);
    }
    win.addBrowserView(view);
    // Position below toolbar (renderer will send exact bounds via layout:viewBounds)
    const [w, h] = win.getContentSize();
    view.setBounds({ x: 0, y: 88, width: w, height: h - 88 });
    view.setAutoResize({ width: true, height: true });
}
//# sourceMappingURL=browser-ipc.js.map