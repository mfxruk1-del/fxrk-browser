import { ipcMain, app, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { db } from '../services/DatabaseService'
import { IPC_CHANNELS } from '../utils/constants'
import { logger } from '../utils/logger'
import type { AppSettings } from '../utils/types'

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'cyberpunk',
  defaultSearchEngine: 'duckduckgo',
  customSearchUrl: '',
  homePage: 'fxrk://newtab',
  startupBehavior: 'last-session',
  downloadPath: app?.getPath('downloads') || path.join(process.env.USERPROFILE || '', 'Downloads'),
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
}

export function registerSettingsIPC(): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_, key?: string) => {
    if (key) {
      const defaultVal = DEFAULT_SETTINGS[key as keyof AppSettings]
      return db.getSetting(key, defaultVal as unknown as undefined)
    }
    // Return all settings
    const settings: Partial<AppSettings> = {}
    for (const [k, defaultVal] of Object.entries(DEFAULT_SETTINGS)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(settings as Record<string, unknown>)[k] = db.getSetting(k, defaultVal as any) as AppSettings[keyof AppSettings]
    }
    return settings
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_, key: string, value: unknown) => {
    db.setSetting(key, value)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, () => {
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      db.setSetting(k, v)
    }
    return DEFAULT_SETTINGS
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_EXPORT, async () => {
    const { dialog } = await import('electron')
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export FXRK Backup',
      defaultPath: `fxrk-backup-${new Date().toISOString().split('T')[0]}.fxrkbackup`,
      filters: [{ name: 'FXRK Backup', extensions: ['fxrkbackup'] }],
    })

    if (!filePath) return false

    // Collect all settings into backup object
    const backup = {
      version: '1.0.0',
      exportedAt: Date.now(),
      settings: DEFAULT_SETTINGS,
    }

    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2))
    return true
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_IMPORT, async () => {
    const { dialog } = await import('electron')
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Import FXRK Backup',
      filters: [{ name: 'FXRK Backup', extensions: ['fxrkbackup', 'json'] }],
      properties: ['openFile'],
    })

    if (!filePaths[0]) return false

    try {
      const data = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))
      if (data.settings) {
        for (const [k, v] of Object.entries(data.settings)) {
          db.setSetting(k, v)
        }
      }
      return true
    } catch (err) {
      logger.error(`Import failed: ${err}`)
      return false
    }
  })

  // App info
  ipcMain.handle('app:getVersion', () => app?.getVersion() || '1.0.0')
  ipcMain.handle('app:getPath', (_, name: string) => {
    try {
      return app?.getPath(name as Parameters<typeof app.getPath>[0])
    } catch {
      return null
    }
  })

  ipcMain.handle('app:openExternal', (_, url: string) => shell.openExternal(url))

  ipcMain.handle('app:openPath', (_, p: string) => shell.openPath(p))

  ipcMain.handle('app:getDefaultDownloadPath', () =>
    app?.getPath('downloads') || path.join(process.env.USERPROFILE || '', 'Downloads')
  )

  // Import bookmarks from Chrome/Firefox HTML
  ipcMain.handle('bookmarks:importHTML', async (_, profileId: string) => {
    const { dialog } = await import('electron')
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Import Bookmarks',
      filters: [{ name: 'Bookmark HTML', extensions: ['html', 'htm'] }],
      properties: ['openFile'],
    })

    if (!filePaths[0]) return 0

    try {
      const html = fs.readFileSync(filePaths[0], 'utf8')
      const imported = parseBookmarkHTML(html, profileId)
      for (const bookmark of imported) {
        db.addBookmark(bookmark)
      }
      return imported.length
    } catch (err) {
      logger.error(`Bookmark import failed: ${err}`)
      return 0
    }
  })

  logger.info('Settings IPC handlers registered')
}

function parseBookmarkHTML(html: string, profileId: string): import('../utils/types').Bookmark[] {
  const { v4: uuidv4 } = require('uuid')
  const bookmarks: import('../utils/types').Bookmark[] = []

  // Simple regex-based HTML bookmark parser
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]
    const title = match[2].trim()

    if (!url.startsWith('http')) continue

    bookmarks.push({
      id: uuidv4(),
      url,
      title: title || url,
      favicon: '',
      folderId: null,
      profileId,
      createdAt: Date.now(),
      tags: [],
    })
  }

  return bookmarks
}
