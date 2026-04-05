import { ipcMain, BrowserWindow, clipboard } from 'electron'
import { phoneBridge } from '../services/PhoneBridge'
import { db } from '../services/DatabaseService'
import { IPC_CHANNELS, CLIPBOARD_SYNC_INTERVAL } from '../utils/constants'
import { logger } from '../utils/logger'
import type { PhoneBridgeConfig } from '../utils/types'

let clipboardSyncTimer: NodeJS.Timeout | null = null

export function registerPhoneIPC(mainWindow: BrowserWindow): void {
  // Set main window reference on bridge so it can send events
  phoneBridge.setMainWindow(mainWindow)

  // Forward bridge events to renderer
  phoneBridge.on('statusChange', (status) => {
    mainWindow.webContents.send('phone:statusChange', status)
  })

  phoneBridge.on('newMessage', (msg) => {
    mainWindow.webContents.send('phone:newMessage', msg)
  })

  phoneBridge.on('conversationsUpdated', (convs) => {
    mainWindow.webContents.send('phone:conversationsUpdated', convs)
  })

  phoneBridge.on('twoFactorRequired', () => {
    mainWindow.webContents.send('phone:2faRequired')
  })

  ipcMain.handle(IPC_CHANNELS.PHONE_CONNECT, async (_, config: PhoneBridgeConfig) => {
    db.savePhoneConfig(config)
    await phoneBridge.connect(config)
    return phoneBridge.getStatus()
  })

  ipcMain.handle(IPC_CHANNELS.PHONE_DISCONNECT, async () => {
    await phoneBridge.disconnect()
    stopClipboardSync()
    return true
  })

  ipcMain.handle(IPC_CHANNELS.PHONE_GET_STATUS, () =>
    phoneBridge.getStatus()
  )

  ipcMain.handle(IPC_CHANNELS.PHONE_GET_CONVERSATIONS, () =>
    phoneBridge.getConversations()
  )

  ipcMain.handle(IPC_CHANNELS.PHONE_GET_MESSAGES, (_, conversationId: string) =>
    phoneBridge.getMessages(conversationId)
  )

  ipcMain.handle(IPC_CHANNELS.PHONE_SEND_MESSAGE, async (_, to: string, text: string) => {
    await phoneBridge.sendMessage(to, text)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.PHONE_SEND_LINK, async (_, url: string) => {
    await phoneBridge.sendToPhone('link', url, 'FXRK Link')
    return true
  })

  ipcMain.handle(IPC_CHANNELS.PHONE_SEND_NOTE, async (_, content: string, title?: string) => {
    await phoneBridge.sendToPhone('note', content, title)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.PHONE_SYNC_CLIPBOARD, async (_, direction: 'toPhone' | 'fromPhone') => {
    if (direction === 'toPhone') {
      const text = clipboard.readText()
      if (text) {
        await phoneBridge.sendToPhone('clipboard', text)
      }
      return text
    } else {
      const content = await phoneBridge.checkPhoneClipboard()
      if (content) {
        clipboard.writeText(content)
      }
      return content
    }
  })

  // 2FA code submission from renderer
  ipcMain.on('phone:submit2FA', (_, code: string) => {
    phoneBridge.provide2FACode(code)
  })

  // Get saved phone config (without decrypted password)
  ipcMain.handle('phone:getConfig', () => {
    const config = db.getPhoneConfig()
    if (!config) return null
    return {
      appleId: config.appleId,
      appSpecificPassword: '', // Never send decrypted password to renderer
      hasPassword: !!config.appSpecificPassword,
      lastConnected: config.lastConnected,
    }
  })

  // Auto-reconnect on startup if previously connected
  ipcMain.handle('phone:autoReconnect', async () => {
    const config = db.getPhoneConfig()
    if (!config || !config.appleId || !config.appSpecificPassword) return false
    if (!config.lastConnected) return false

    try {
      await phoneBridge.connect(config)
      return true
    } catch {
      return false
    }
  })

  // Start clipboard sync monitoring
  ipcMain.on('phone:startClipboardSync', () => {
    startClipboardSync(mainWindow)
  })

  ipcMain.on('phone:stopClipboardSync', () => {
    stopClipboardSync()
  })

  logger.phone.info('Phone IPC handlers registered')
}

function startClipboardSync(mainWindow: BrowserWindow): void {
  if (clipboardSyncTimer) return

  clipboardSyncTimer = setInterval(async () => {
    if (!phoneBridge.getStatus().connected) return

    const content = await phoneBridge.checkPhoneClipboard().catch(() => null)
    if (content) {
      clipboard.writeText(content)
      mainWindow.webContents.send('phone:clipboardFromPhone', content)
    }
  }, CLIPBOARD_SYNC_INTERVAL)
}

function stopClipboardSync(): void {
  if (clipboardSyncTimer) {
    clearInterval(clipboardSyncTimer)
    clipboardSyncTimer = null
  }
}
