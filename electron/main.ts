import { app, BrowserWindow, globalShortcut, protocol, session, nativeTheme } from 'electron'
import path from 'path'
import { logger } from './utils/logger'
import { db } from './services/DatabaseService'
import { privacyEngine } from './services/PrivacyEngine'
import { uaManager } from './services/UserAgentManager'
import { containerService } from './services/ContainerService'
import { registerBrowserIPC } from './ipc/browser-ipc'
import { registerPrivacyIPC } from './ipc/privacy-ipc'
import { registerAuthIPC } from './ipc/auth-ipc'
import { registerPhoneIPC } from './ipc/phone-ipc'
import { registerSettingsIPC } from './ipc/settings-ipc'
import { SESSION_SAVE_INTERVAL } from './utils/constants'

// ============================================================
// FXRK Browser - Main Process Entry Point
// ============================================================

// Disable hardware acceleration if preference demands it (do before app.ready)
const enableHWAccel = true // Will check DB after init
if (!enableHWAccel) app.disableHardwareAcceleration()

// Set app user model ID for Windows taskbar
if (process.platform === 'win32') {
  app.setAppUserModelId('com.fxrk.browser')
}

// Force dark mode
nativeTheme.themeSource = 'dark'

// Register fxrk:// as a standard URL scheme so Electron handles it
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'fxrk',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: false,
    },
  },
])

let mainWindow: BrowserWindow | null = null
let sessionSaveTimer: NodeJS.Timeout | null = null

async function createMainWindow(): Promise<void> {
  const preloadPath = path.join(__dirname, 'preload.js')

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    frame: false,        // Custom frameless title bar
    transparent: false,
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, '../../resources/icon.ico'),
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
  })

  // Load the React app
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173')
    // Open DevTools for the main renderer in development
    // mainWindow.webContents.openDevTools()
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show()
    logger.info('Main window shown')
  })

  mainWindow.on('maximize', () => {
    mainWindow!.webContents.send('window:maximized', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow!.webContents.send('window:maximized', false)
  })

  mainWindow.on('resize', () => {
    mainWindow!.webContents.send('window:resize', mainWindow!.getContentSize())
  })

  mainWindow.on('close', async () => {
    // Save session before closing
    mainWindow!.webContents.send('app:beforeClose')
    clearInterval(sessionSaveTimer!)
  })
}

app.whenReady().then(async () => {
  logger.info(`FXRK Browser starting (${app.getVersion()})`)
  logger.info(`Platform: ${process.platform}, Electron: ${process.versions.electron}`)

  // ── Register fxrk:// protocol handler ────────────────────
  protocol.handle('fxrk', (request) => {
    const url = new URL(request.url)
    const page = url.hostname // "newtab", "settings", etc.

    // For internal pages, return the main HTML with a query param
    // The React renderer reads the URL and shows the right page
    if (process.env.NODE_ENV === 'development') {
      return fetch(`http://localhost:5173/?fxrk=${page}`)
    }

    const indexPath = path.join(__dirname, '../../dist/index.html')
    return new Response(require('fs').readFileSync(indexPath), {
      headers: { 'Content-Type': 'text/html' },
    })
  })

  // ── Initialize services ───────────────────────────────────
  db.initialize()

  // Set up session-wide privacy settings
  const defaultSess = session.defaultSession
  await privacyEngine.initialize(defaultSess)
  uaManager.reloadSettings()
  uaManager.applyToSession(defaultSess)
  containerService.initialize('default')

  // ── Create main window ────────────────────────────────────
  await createMainWindow()

  if (!mainWindow) return

  // ── Register IPC handlers ─────────────────────────────────
  registerBrowserIPC(mainWindow)
  registerPrivacyIPC()
  registerAuthIPC()
  registerPhoneIPC(mainWindow)
  registerSettingsIPC()

  // ── Register global keyboard shortcuts ────────────────────
  registerGlobalShortcuts()

  // ── Auto-save session every 5 minutes ─────────────────────
  sessionSaveTimer = setInterval(() => {
    mainWindow?.webContents.send('app:saveSession')
  }, SESSION_SAVE_INTERVAL)

  // ── macOS: re-create window on dock click ─────────────────
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })

  logger.info('App initialization complete')
})

app.on('window-all-closed', () => {
  // On macOS it's common to keep the app running
  if (process.platform !== 'darwin') {
    db.close()
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  db.close()
})

// ── Security: prevent new windows from opening external URLs ──
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    // Log and deny arbitrary window.open() calls
    logger.browser.info(`Blocked window.open: ${url}`)
    // Instead, tell renderer to open as new tab
    mainWindow?.webContents.send('browser:openNewTab', url)
    return { action: 'deny' }
  })

  contents.on('will-navigate', (event, url) => {
    // Prevent navigation to javascript: or data: URLs
    if (url.startsWith('javascript:') || url.startsWith('data:')) {
      event.preventDefault()
    }
  })
})

function registerGlobalShortcuts(): void {
  if (!mainWindow) return

  // These shortcuts affect the main renderer, not individual webviews
  // (Individual webview shortcuts are handled in the renderer via KeyboardShortcuts hook)
  const shortcuts: Array<{ key: string; action: string }> = [
    { key: 'F12', action: 'devtools' },
    { key: 'Ctrl+Shift+I', action: 'devtools' },
    { key: 'F11', action: 'fullscreen' },
  ]

  for (const { key, action } of shortcuts) {
    globalShortcut.register(key, () => {
      mainWindow?.webContents.send(`shortcut:${action}`)
    })
  }
}
