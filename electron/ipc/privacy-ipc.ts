import { ipcMain } from 'electron'
import { privacyEngine } from '../services/PrivacyEngine'
import { uaManager } from '../services/UserAgentManager'
import { db } from '../services/DatabaseService'
import { IPC_CHANNELS } from '../utils/constants'
import { logger } from '../utils/logger'

export function registerPrivacyIPC(): void {
  ipcMain.handle(IPC_CHANNELS.PRIVACY_GET_SETTINGS, () =>
    privacyEngine.getSettings()
  )

  ipcMain.handle(IPC_CHANNELS.PRIVACY_SET_SETTINGS, (_, partial) => {
    privacyEngine.updateSettings(partial)
    return privacyEngine.getSettings()
  })

  ipcMain.handle(IPC_CHANNELS.PRIVACY_GET_BLOCKED_COUNT, () =>
    db.getBlockedCount()
  )

  ipcMain.handle(IPC_CHANNELS.PRIVACY_TOGGLE_SITE, (_, domain: string, adBlockEnabled: boolean) => {
    privacyEngine.toggleSiteAdBlocking(domain, adBlockEnabled)
  })

  ipcMain.handle(IPC_CHANNELS.PRIVACY_GET_GRADE, (_, url: string, blockedCount: number, isHTTPS: boolean) =>
    privacyEngine.getPrivacyGrade(url, blockedCount, isHTTPS)
  )

  ipcMain.handle(IPC_CHANNELS.PRIVACY_CLEAR_COOKIES, async (_, partition?: string) => {
    const { session } = await import('electron')
    const sess = partition ? session.fromPartition(partition) : session.defaultSession
    await sess.clearStorageData({ storages: ['cookies'] })
  })

  ipcMain.handle(IPC_CHANNELS.PRIVACY_GET_COOKIES, async (_, url: string, partition?: string) => {
    const { session } = await import('electron')
    const sess = partition ? session.fromPartition(partition) : session.defaultSession
    return sess.cookies.get({ url })
  })

  // User Agent
  ipcMain.handle('ua:getSettings', () => uaManager.getSettings())
  ipcMain.handle('ua:getPresets', () => uaManager.getPresets())
  ipcMain.handle('ua:updateSettings', (_, partial) => uaManager.updateSettings(partial))
  ipcMain.handle('ua:setSiteRule', (_, domain: string, uaId: string | null) =>
    uaManager.setSiteRule(domain, uaId)
  )

  // Custom filters
  ipcMain.handle('filters:get', () => db.getCustomFilters())
  ipcMain.handle('filters:save', (_, filter) => db.saveCustomFilter(filter))

  // DoH settings stored in DB
  ipcMain.handle('doh:getConfig', () => db.getSetting('doh', { provider: 'cloudflare' }))
  ipcMain.handle('doh:setConfig', (_, config) => db.setSetting('doh', config))

  logger.privacy.info('Privacy IPC handlers registered')
}
