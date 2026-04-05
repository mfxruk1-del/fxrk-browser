"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const logger_1 = require("./utils/logger");
const DatabaseService_1 = require("./services/DatabaseService");
const PrivacyEngine_1 = require("./services/PrivacyEngine");
const UserAgentManager_1 = require("./services/UserAgentManager");
const ContainerService_1 = require("./services/ContainerService");
const browser_ipc_1 = require("./ipc/browser-ipc");
const privacy_ipc_1 = require("./ipc/privacy-ipc");
const auth_ipc_1 = require("./ipc/auth-ipc");
const phone_ipc_1 = require("./ipc/phone-ipc");
const settings_ipc_1 = require("./ipc/settings-ipc");
const constants_1 = require("./utils/constants");
// ============================================================
// FXRK Browser - Main Process Entry Point
// ============================================================
// Disable hardware acceleration if preference demands it (do before app.ready)
const enableHWAccel = true; // Will check DB after init
if (!enableHWAccel)
    electron_1.app.disableHardwareAcceleration();
// Set app user model ID for Windows taskbar
if (process.platform === 'win32') {
    electron_1.app.setAppUserModelId('com.fxrk.browser');
}
// Force dark mode
electron_1.nativeTheme.themeSource = 'dark';
// Register fxrk:// as a standard URL scheme so Electron handles it
electron_1.protocol.registerSchemesAsPrivileged([
    {
        scheme: 'fxrk',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: false,
        },
    },
]);
let mainWindow = null;
let sessionSaveTimer = null;
async function createMainWindow() {
    const preloadPath = path_1.default.join(__dirname, 'preload.js');
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 500,
        frame: false, // Custom frameless title bar
        transparent: false,
        backgroundColor: '#0a0a0a',
        icon: path_1.default.join(__dirname, '../../resources/icon.ico'),
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // Main renderer needs some node access via preload
            preload: preloadPath,
            webSecurity: true,
            allowRunningInsecureContent: false,
            navigateOnDragDrop: false,
            spellcheck: true,
        },
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 12, y: 12 },
    });
    // Load the React app
    if (process.env.NODE_ENV === 'development') {
        await mainWindow.loadURL('http://localhost:5173');
        // Open DevTools for the main renderer in development
        // mainWindow.webContents.openDevTools()
    }
    else {
        await mainWindow.loadFile(path_1.default.join(__dirname, '../../dist/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        logger_1.logger.info('Main window shown');
    });
    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('window:maximized', true);
    });
    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('window:maximized', false);
    });
    mainWindow.on('resize', () => {
        mainWindow.webContents.send('window:resize', mainWindow.getContentSize());
    });
    mainWindow.on('close', async () => {
        // Save session before closing
        mainWindow.webContents.send('app:beforeClose');
        clearInterval(sessionSaveTimer);
    });
}
electron_1.app.whenReady().then(async () => {
    logger_1.logger.info(`FXRK Browser starting (${electron_1.app.getVersion()})`);
    logger_1.logger.info(`Platform: ${process.platform}, Electron: ${process.versions.electron}`);
    // ── Register fxrk:// protocol handler ────────────────────
    electron_1.protocol.handle('fxrk', (request) => {
        const url = new URL(request.url);
        const page = url.hostname; // "newtab", "settings", etc.
        // For internal pages, return the main HTML with a query param
        // The React renderer reads the URL and shows the right page
        if (process.env.NODE_ENV === 'development') {
            return fetch(`http://localhost:5173/?fxrk=${page}`);
        }
        const indexPath = path_1.default.join(__dirname, '../../dist/index.html');
        return new Response(require('fs').readFileSync(indexPath), {
            headers: { 'Content-Type': 'text/html' },
        });
    });
    // ── Initialize services ───────────────────────────────────
    DatabaseService_1.db.initialize();
    // Set up session-wide privacy settings
    const defaultSess = electron_1.session.defaultSession;
    await PrivacyEngine_1.privacyEngine.initialize(defaultSess);
    UserAgentManager_1.uaManager.reloadSettings();
    UserAgentManager_1.uaManager.applyToSession(defaultSess);
    ContainerService_1.containerService.initialize('default');
    // ── Create main window ────────────────────────────────────
    await createMainWindow();
    if (!mainWindow)
        return;
    // ── Register IPC handlers ─────────────────────────────────
    (0, browser_ipc_1.registerBrowserIPC)(mainWindow);
    (0, privacy_ipc_1.registerPrivacyIPC)();
    (0, auth_ipc_1.registerAuthIPC)();
    (0, phone_ipc_1.registerPhoneIPC)(mainWindow);
    (0, settings_ipc_1.registerSettingsIPC)();
    // ── Register global keyboard shortcuts ────────────────────
    registerGlobalShortcuts();
    // ── Auto-save session every 5 minutes ─────────────────────
    sessionSaveTimer = setInterval(() => {
        mainWindow?.webContents.send('app:saveSession');
    }, constants_1.SESSION_SAVE_INTERVAL);
    // ── macOS: re-create window on dock click ─────────────────
    electron_1.app.on('activate', async () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            await createMainWindow();
        }
    });
    logger_1.logger.info('App initialization complete');
});
electron_1.app.on('window-all-closed', () => {
    // On macOS it's common to keep the app running
    if (process.platform !== 'darwin') {
        DatabaseService_1.db.close();
        electron_1.app.quit();
    }
});
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
    DatabaseService_1.db.close();
});
// ── Security: prevent new windows from opening external URLs ──
electron_1.app.on('web-contents-created', (_, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        // Log and deny arbitrary window.open() calls
        logger_1.logger.browser.info(`Blocked window.open: ${url}`);
        // Instead, tell renderer to open as new tab
        mainWindow?.webContents.send('browser:openNewTab', url);
        return { action: 'deny' };
    });
    contents.on('will-navigate', (event, url) => {
        // Prevent navigation to javascript: or data: URLs
        if (url.startsWith('javascript:') || url.startsWith('data:')) {
            event.preventDefault();
        }
    });
});
function registerGlobalShortcuts() {
    if (!mainWindow)
        return;
    // These shortcuts affect the main renderer, not individual webviews
    // (Individual webview shortcuts are handled in the renderer via KeyboardShortcuts hook)
    const shortcuts = [
        { key: 'F12', action: 'devtools' },
        { key: 'Ctrl+Shift+I', action: 'devtools' },
        { key: 'F11', action: 'fullscreen' },
    ];
    for (const { key, action } of shortcuts) {
        electron_1.globalShortcut.register(key, () => {
            mainWindow?.webContents.send(`shortcut:${action}`);
        });
    }
}
//# sourceMappingURL=main.js.map