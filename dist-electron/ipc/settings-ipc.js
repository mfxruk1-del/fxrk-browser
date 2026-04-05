"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSettingsIPC = registerSettingsIPC;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DatabaseService_1 = require("../services/DatabaseService");
const constants_1 = require("../utils/constants");
const logger_1 = require("../utils/logger");
const DEFAULT_SETTINGS = {
    theme: 'cyberpunk',
    defaultSearchEngine: 'duckduckgo',
    customSearchUrl: '',
    homePage: 'fxrk://newtab',
    startupBehavior: 'last-session',
    downloadPath: electron_1.app?.getPath('downloads') || path_1.default.join(process.env.USERPROFILE || '', 'Downloads'),
    askDownloadLocation: false,
    defaultZoom: 1.0,
    fontSize: 14,
    showScrollbars: true,
    hardwareAcceleration: true,
    tabBarPosition: 'top',
    sidebarPosition: 'right',
    showStatusBar: true,
    compactMode: false,
    language: 'en-US',
    spellCheck: true,
    autofillEnabled: true,
    passwordManagerEnabled: true,
    syncEnabled: false,
    notificationsEnabled: true,
    soundEnabled: false,
    sessionRestore: true,
    autoSaveSession: true,
};
function registerSettingsIPC() {
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SETTINGS_GET, (_, key) => {
        if (key) {
            const defaultVal = DEFAULT_SETTINGS[key];
            return DatabaseService_1.db.getSetting(key, defaultVal);
        }
        // Return all settings
        const settings = {};
        for (const [k, defaultVal] of Object.entries(DEFAULT_SETTINGS)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;
            settings[k] = DatabaseService_1.db.getSetting(k, defaultVal);
        }
        return settings;
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SETTINGS_SET, (_, key, value) => {
        DatabaseService_1.db.setSetting(key, value);
        return true;
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SETTINGS_RESET, () => {
        for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
            DatabaseService_1.db.setSetting(k, v);
        }
        return DEFAULT_SETTINGS;
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SETTINGS_EXPORT, async () => {
        const { dialog } = await Promise.resolve().then(() => __importStar(require('electron')));
        const { filePath } = await dialog.showSaveDialog({
            title: 'Export FXRK Backup',
            defaultPath: `fxrk-backup-${new Date().toISOString().split('T')[0]}.fxrkbackup`,
            filters: [{ name: 'FXRK Backup', extensions: ['fxrkbackup'] }],
        });
        if (!filePath)
            return false;
        // Collect all settings into backup object
        const backup = {
            version: '1.0.0',
            exportedAt: Date.now(),
            settings: DEFAULT_SETTINGS,
        };
        fs_1.default.writeFileSync(filePath, JSON.stringify(backup, null, 2));
        return true;
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SETTINGS_IMPORT, async () => {
        const { dialog } = await Promise.resolve().then(() => __importStar(require('electron')));
        const { filePaths } = await dialog.showOpenDialog({
            title: 'Import FXRK Backup',
            filters: [{ name: 'FXRK Backup', extensions: ['fxrkbackup', 'json'] }],
            properties: ['openFile'],
        });
        if (!filePaths[0])
            return false;
        try {
            const data = JSON.parse(fs_1.default.readFileSync(filePaths[0], 'utf8'));
            if (data.settings) {
                for (const [k, v] of Object.entries(data.settings)) {
                    DatabaseService_1.db.setSetting(k, v);
                }
            }
            return true;
        }
        catch (err) {
            logger_1.logger.error(`Import failed: ${err}`);
            return false;
        }
    });
    // App info
    electron_1.ipcMain.handle('app:getVersion', () => electron_1.app?.getVersion() || '1.0.0');
    electron_1.ipcMain.handle('app:getPath', (_, name) => {
        try {
            return electron_1.app?.getPath(name);
        }
        catch {
            return null;
        }
    });
    electron_1.ipcMain.handle('app:openExternal', (_, url) => electron_1.shell.openExternal(url));
    electron_1.ipcMain.handle('app:openPath', (_, p) => electron_1.shell.openPath(p));
    electron_1.ipcMain.handle('app:getDefaultDownloadPath', () => electron_1.app?.getPath('downloads') || path_1.default.join(process.env.USERPROFILE || '', 'Downloads'));
    // Import bookmarks from Chrome/Firefox HTML
    electron_1.ipcMain.handle('bookmarks:importHTML', async (_, profileId) => {
        const { dialog } = await Promise.resolve().then(() => __importStar(require('electron')));
        const { filePaths } = await dialog.showOpenDialog({
            title: 'Import Bookmarks',
            filters: [{ name: 'Bookmark HTML', extensions: ['html', 'htm'] }],
            properties: ['openFile'],
        });
        if (!filePaths[0])
            return 0;
        try {
            const html = fs_1.default.readFileSync(filePaths[0], 'utf8');
            const imported = parseBookmarkHTML(html, profileId);
            for (const bookmark of imported) {
                DatabaseService_1.db.addBookmark(bookmark);
            }
            return imported.length;
        }
        catch (err) {
            logger_1.logger.error(`Bookmark import failed: ${err}`);
            return 0;
        }
    });
    logger_1.logger.info('Settings IPC handlers registered');
}
function parseBookmarkHTML(html, profileId) {
    const { v4: uuidv4 } = require('uuid');
    const bookmarks = [];
    // Simple regex-based HTML bookmark parser
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const url = match[1];
        const title = match[2].trim();
        if (!url.startsWith('http'))
            continue;
        bookmarks.push({
            id: uuidv4(),
            url,
            title: title || url,
            favicon: '',
            folderId: null,
            profileId,
            createdAt: Date.now(),
            tags: [],
        });
    }
    return bookmarks;
}
//# sourceMappingURL=settings-ipc.js.map