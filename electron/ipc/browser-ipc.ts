import { ipcMain, BrowserWindow, BrowserView, clipboard, shell, dialog } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { logger } from '../utils/logger'
import { db } from '../services/DatabaseService'
import { privacyEngine } from '../services/PrivacyEngine'
import { containerService } from '../services/ContainerService'
import { normalizeInput, extractDomain } from '../utils/validators'
import { IPC_CHANNELS, DEFAULT_HOME_PAGE } from '../utils/constants'
import type { Tab, HistoryEntry, Bookmark, BookmarkFolder, Download } from '../utils/types'

// ============================================================
// FXRK Browser - Browser IPC Handlers
// Handles tab management, navigation, bookmarks, history,
// downloads, zoom, find-in-page, and DevTools.
// ============================================================

// Map of BrowserViews indexed by tab ID
const tabViews = new Map<string, BrowserView>()
// Currently active tab ID per window
let activeTabId: string | null = null
// Map of find-in-page request IDs
const findInPageActive = new Map<string, boolean>()

export function registerBrowserIPC(mainWindow: BrowserWindow): void {
  // ── Tab Management ────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.TAB_CREATE, async (_, opts: {
    url?: string
    containerId?: string | null
    profileId?: string
    background?: boolean
  } = {}) => {
    const id = uuidv4()
    const url = normalizeInput(opts.url || DEFAULT_HOME_PAGE)
    const profileId = opts.profileId || 'default'
    const containerId = opts.containerId ?? null

    const partition = containerService.getPartition(containerId, profileId)
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        partition,
        preload: path.join(__dirname, '../../dist-electron/preload.js'),
        allowRunningInsecureContent: false,
        webSecurity: true,
        navigateOnDragDrop: false,
      },
    })

    tabViews.set(id, view)

    // Initialize privacy engine for this session if not already done
    await privacyEngine.initialize(view.webContents.session)

    // Inject fingerprint spoofer as a preload script content
    const spoofScript = privacyEngine.buildFingerprintSpooferScript()
    view.webContents.session.setPreloads([
      path.join(__dirname, '../../dist-electron/preload.js'),
    ])

    // Track navigation events
    view.webContents.on('did-navigate', (_, url) => {
      privacyEngine.updateTabDomain(view.webContents.id, url)
      privacyEngine.resetBlockedCount(view.webContents.id)
      mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, {
        id,
        url,
        title: view.webContents.getTitle(),
        isLoading: false,
        canGoBack: view.webContents.canGoBack(),
        canGoForward: view.webContents.canGoForward(),
      })

      // Record in history (skip internal pages)
      if (!url.startsWith('fxrk://') && url !== 'about:blank') {
        db.addHistory({
          id: uuidv4(),
          url,
          title: view.webContents.getTitle(),
          favicon: '',
          visitedAt: Date.now(),
          visitCount: 1,
          profileId,
        })
      }
    })

    view.webContents.on('did-start-loading', () => {
      mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, { id, isLoading: true })
    })

    view.webContents.on('did-stop-loading', () => {
      mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, {
        id,
        isLoading: false,
        title: view.webContents.getTitle(),
        url: view.webContents.getURL(),
      })
    })

    view.webContents.on('page-title-updated', (_, title) => {
      mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, { id, title })
    })

    view.webContents.on('page-favicon-updated', (_, favicons) => {
      if (favicons.length > 0) {
        mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, { id, favicon: favicons[0] })
      }
    })

    view.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
      mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, {
        id, isLoading: false, errorCode, errorDescription,
      })
    })

    // Inject fingerprint spoofer before page scripts run
    view.webContents.on('dom-ready', () => {
      view.webContents.executeJavaScript(spoofScript).catch(() => {})
    })

    // Handle downloads
    view.webContents.session.on('will-download', (_, item) => {
      const downloadId = uuidv4()
      const defaultPath = path.join(
        db.getSetting<string>('downloadPath', process.env.USERPROFILE
          ? path.join(process.env.USERPROFILE, 'Downloads')
          : '.'),
        item.getFilename()
      )

      item.setSavePath(defaultPath)

      const download: Download = {
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
      }

      db.saveDownload(download)
      mainWindow.webContents.send(IPC_CHANNELS.DOWNLOAD_ITEM, download)

      item.on('updated', (_, state) => {
        const update = {
          ...download,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes(),
          state: state === 'interrupted' ? 'interrupted' : 'progressing',
          paused: item.isPaused(),
          speed: 0,
        }
        db.updateDownloadProgress(downloadId, item.getReceivedBytes(), update.state)
        mainWindow.webContents.send(IPC_CHANNELS.DOWNLOAD_ITEM, update)
      })

      item.on('done', (_, state) => {
        const finalState = state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted'
        db.updateDownloadProgress(downloadId, item.getReceivedBytes(), finalState)
        mainWindow.webContents.send(IPC_CHANNELS.DOWNLOAD_ITEM, {
          ...download,
          receivedBytes: item.getReceivedBytes(),
          state: finalState,
          completedAt: Date.now(),
        })
      })
    })

    // Navigate to initial URL
    if (!opts.background) {
      activeTabId = id
      attachView(mainWindow, view)
    }

    if (url !== DEFAULT_HOME_PAGE && !url.startsWith('fxrk://')) {
      await view.webContents.loadURL(url).catch(err =>
        logger.browser.warn(`Failed to load ${url}: ${err}`)
      )
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
      zoomLevel: db.getSiteZoom(extractDomain(url)),
      scrollPosition: { x: 0, y: 0 },
    } as Tab
  })

  ipcMain.handle(IPC_CHANNELS.TAB_SWITCH, (_, tabId: string) => {
    const view = tabViews.get(tabId)
    if (!view) return false

    activeTabId = tabId
    attachView(mainWindow, view)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.TAB_CLOSE, (_, tabId: string) => {
    const view = tabViews.get(tabId)
    if (!view) return

    // Track for "reopen closed tab" feature
    db.pushClosedTab({
      id: tabId,
      url: view.webContents.getURL(),
      title: view.webContents.getTitle(),
      favicon: '',
      profileId: 'default',
    })

    mainWindow.removeBrowserView(view)
    view.webContents.close()
    tabViews.delete(tabId)

    if (activeTabId === tabId) {
      activeTabId = null
    }
  })

  ipcMain.handle(IPC_CHANNELS.TAB_PIN, (_, tabId: string, pinned: boolean) => {
    mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, { id: tabId, isPinned: pinned })
  })

  ipcMain.handle(IPC_CHANNELS.TAB_MUTE, (_, tabId: string, muted: boolean) => {
    const view = tabViews.get(tabId)
    if (!view) return
    view.webContents.setAudioMuted(muted)
    mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, { id: tabId, isMuted: muted })
  })

  ipcMain.handle(IPC_CHANNELS.TAB_DUPLICATE, async (_, tabId: string) => {
    const view = tabViews.get(tabId)
    if (!view) return null
    const url = view.webContents.getURL()
    // Create new tab with same URL (handled recursively via TAB_CREATE)
    return { url }
  })

  // ── Navigation ────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.NAVIGATE, async (_, tabId: string, url: string) => {
    const view = tabViews.get(tabId)
    if (!view) return false

    const normalized = normalizeInput(url, db.getSetting<string>('searchEngine', 'https://duckduckgo.com/?q=%s'))

    if (normalized.startsWith('fxrk://')) {
      // Internal page — notify renderer to show it
      mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, {
        id: tabId,
        url: normalized,
        title: normalized.replace('fxrk://', '').toUpperCase(),
        isLoading: false,
      })
      return true
    }

    await view.webContents.loadURL(normalized).catch(err =>
      logger.browser.warn(`Navigation error: ${err}`)
    )
    return true
  })

  ipcMain.handle(IPC_CHANNELS.NAVIGATE_BACK, (_, tabId: string) => {
    tabViews.get(tabId)?.webContents.goBack()
  })

  ipcMain.handle(IPC_CHANNELS.NAVIGATE_FORWARD, (_, tabId: string) => {
    tabViews.get(tabId)?.webContents.goForward()
  })

  ipcMain.handle(IPC_CHANNELS.NAVIGATE_REFRESH, (_, tabId: string) => {
    tabViews.get(tabId)?.webContents.reload()
  })

  ipcMain.handle(IPC_CHANNELS.NAVIGATE_STOP, (_, tabId: string) => {
    tabViews.get(tabId)?.webContents.stop()
  })

  ipcMain.handle(IPC_CHANNELS.NAVIGATE_HOME, (_, tabId: string) => {
    const homeUrl = db.getSetting<string>('homePage', 'fxrk://newtab')
    mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, {
      id: tabId,
      url: homeUrl,
      title: 'Home',
      isLoading: false,
    })
  })

  // ── Find in Page ──────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.FIND_IN_PAGE, (_, tabId: string, query: string, options: {
    forward?: boolean
    findNext?: boolean
    matchCase?: boolean
  } = {}) => {
    const view = tabViews.get(tabId)
    if (!view) return

    view.webContents.findInPage(query, {
      forward: options.forward !== false,
      findNext: options.findNext || false,
      matchCase: options.matchCase || false,
    })

    view.webContents.once('found-in-page', (_, result) => {
      mainWindow.webContents.send('find:result', {
        tabId,
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches,
      })
    })
  })

  ipcMain.handle(IPC_CHANNELS.FIND_STOP, (_, tabId: string) => {
    tabViews.get(tabId)?.webContents.stopFindInPage('clearSelection')
  })

  // ── DevTools ──────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.DEVTOOLS_OPEN, (_, tabId: string) => {
    const view = tabViews.get(tabId)
    if (!view) return
    if (view.webContents.isDevToolsOpened()) {
      view.webContents.closeDevTools()
    } else {
      view.webContents.openDevTools({ mode: 'detach' })
    }
  })

  // ── Screenshot ────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.SCREENSHOT_CAPTURE, async (_, tabId: string, type: 'visible' | 'full' = 'visible') => {
    const view = tabViews.get(tabId)
    if (!view) return null

    const image = await view.webContents.capturePage()
    const pngBuffer = image.toPNG()
    const base64 = pngBuffer.toString('base64')
    return `data:image/png;base64,${base64}`
  })

  // ── Bookmarks ─────────────────────────────────────────────

  ipcMain.handle('bookmarks:get', (_, profileId: string) =>
    db.getBookmarks(profileId)
  )

  ipcMain.handle('bookmarks:add', (_, bookmark: Bookmark) => {
    db.addBookmark(bookmark)
    return bookmark
  })

  ipcMain.handle('bookmarks:delete', (_, id: string) => db.deleteBookmark(id))

  ipcMain.handle('bookmarks:isBookmarked', (_, url: string, profileId: string) =>
    db.isBookmarked(url, profileId)
  )

  ipcMain.handle('bookmarks:getFolders', (_, profileId: string) =>
    db.getBookmarkFolders(profileId)
  )

  ipcMain.handle('bookmarks:addFolder', (_, folder: BookmarkFolder) => {
    db.addBookmarkFolder(folder)
    return folder
  })

  // ── History ───────────────────────────────────────────────

  ipcMain.handle('history:get', (_, profileId: string, limit?: number, offset?: number) =>
    db.getHistory(profileId, limit, offset)
  )

  ipcMain.handle('history:search', (_, profileId: string, query: string) =>
    db.searchHistory(profileId, query)
  )

  ipcMain.handle('history:clear', (_, profileId: string, before?: number) =>
    db.clearHistory(profileId, before)
  )

  ipcMain.handle('history:delete', (_, id: string) => db.deleteHistoryEntry(id))

  // ── Downloads ─────────────────────────────────────────────

  ipcMain.handle('downloads:get', () => db.getDownloads())

  ipcMain.handle('downloads:open', (_, savePath: string) => {
    shell.openPath(savePath)
  })

  ipcMain.handle('downloads:openFolder', (_, savePath: string) => {
    shell.showItemInFolder(savePath)
  })

  // ── Zoom ──────────────────────────────────────────────────

  ipcMain.handle('zoom:set', (_, tabId: string, level: number) => {
    const view = tabViews.get(tabId)
    if (!view) return
    view.webContents.setZoomFactor(level)
    const domain = extractDomain(view.webContents.getURL())
    db.setSiteZoom(domain, level)
    mainWindow.webContents.send(IPC_CHANNELS.TAB_UPDATE, { id: tabId, zoomLevel: level })
  })

  ipcMain.handle('zoom:get', (_, tabId: string) => {
    const view = tabViews.get(tabId)
    return view?.webContents.getZoomFactor() ?? 1.0
  })

  // ── Window Controls ───────────────────────────────────────

  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => mainWindow.minimize())

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => mainWindow.close())

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => mainWindow.isMaximized())

  // ── Layout: BrowserView position update ──────────────────
  // Called when toolbar/tabs layout changes so webview is repositioned
  ipcMain.on('layout:viewBounds', (_, bounds: { x: number; y: number; width: number; height: number }) => {
    const view = activeTabId ? tabViews.get(activeTabId) : null
    if (view) {
      view.setBounds(bounds)
    }
  })

  // ── Notes ─────────────────────────────────────────────────
  ipcMain.handle('notes:get', (_, url: string, profileId: string) =>
    db.getNote(url, profileId)
  )

  ipcMain.handle('notes:save', (_, note) => db.saveNote(note))
  ipcMain.handle('notes:delete', (_, id: string) => db.deleteNote(id))

  // ── Session Save/Restore ──────────────────────────────────

  ipcMain.handle('session:save', (_, tabs: Tab[], profileId: string) => {
    db.saveSession('last', 'Last Session', JSON.stringify(tabs.map(t => ({
      url: t.url, title: t.title, containerId: t.containerId
    }))), profileId)
  })

  ipcMain.handle('session:restore', (_, profileId: string) =>
    db.getLastSession(profileId)
  )

  ipcMain.handle('session:closedTabPop', (_, profileId: string) =>
    db.popClosedTab(profileId)
  )

  // ── Clipboard ─────────────────────────────────────────────

  ipcMain.handle('clipboard:write', (_, text: string) => clipboard.writeText(text))
  ipcMain.handle('clipboard:read', () => clipboard.readText())

  // ── Privacy Blocked Count (per tab) ──────────────────────

  ipcMain.handle('privacy:blockedForTab', (_, tabId: string) => {
    const view = tabViews.get(tabId)
    if (!view) return 0
    return privacyEngine.getBlockedCount(view.webContents.id)
  })

  logger.browser.info('Browser IPC handlers registered')
}

/** Attach a BrowserView to the window and set its bounds */
function attachView(win: BrowserWindow, view: BrowserView): void {
  // Remove all existing views first
  for (const existingView of win.getBrowserViews()) {
    win.removeBrowserView(existingView)
  }
  win.addBrowserView(view)

  // Position below toolbar (renderer will send exact bounds via layout:viewBounds)
  const [w, h] = win.getContentSize()
  view.setBounds({ x: 0, y: 88, width: w, height: h - 88 })
  view.setAutoResize({ width: true, height: true })
}

export { tabViews, activeTabId }
