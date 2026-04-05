import { ipcMain } from 'electron'
import { accountManager } from '../services/AccountManager'
import { IPC_CHANNELS } from '../utils/constants'
import { logger } from '../utils/logger'
import { generatePassword } from '../utils/encryption'
import type { OAuthProviderConfig } from '../utils/types'

export function registerAuthIPC(): void {
  ipcMain.handle(IPC_CHANNELS.AUTH_GET_ACCOUNTS, () =>
    accountManager.getAccounts()
  )

  ipcMain.handle(IPC_CHANNELS.AUTH_ADD_ACCOUNT, async (_, provider: string, config: OAuthProviderConfig) => {
    try {
      return await accountManager.loginWithOAuth(provider, config)
    } catch (err) {
      throw new Error(`OAuth failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_REMOVE_ACCOUNT, (_, id: string) =>
    accountManager.removeAccount(id)
  )

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_PROFILES, () =>
    accountManager.getProfiles()
  )

  ipcMain.handle(IPC_CHANNELS.AUTH_SWITCH_PROFILE, (_, id: string) =>
    accountManager.switchProfile(id)
  )

  ipcMain.handle(IPC_CHANNELS.AUTH_CREATE_PROFILE, (_, name: string, avatar?: string, color?: string) =>
    accountManager.createProfile(name, avatar, color)
  )

  ipcMain.handle('profile:delete', (_, id: string) =>
    accountManager.deleteProfile(id)
  )

  ipcMain.handle('profile:lock', (_, id: string, password: string) =>
    accountManager.lockProfile(id, password)
  )

  ipcMain.handle('profile:unlock', (_, id: string, password: string) =>
    accountManager.unlockProfile(id, password)
  )

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_CREDENTIALS, () =>
    accountManager.getCredentials()
  )

  ipcMain.handle('auth:getCredentialsForDomain', (_, domain: string) =>
    accountManager.getCredentialsForDomain(domain)
  )

  ipcMain.handle(IPC_CHANNELS.AUTH_SAVE_CREDENTIAL, (_, cred) =>
    accountManager.saveCredential(cred)
  )

  ipcMain.handle(IPC_CHANNELS.AUTH_DELETE_CREDENTIAL, (_, id: string) =>
    accountManager.deleteCredential(id)
  )

  ipcMain.handle('auth:generatePassword', (_, length?: number) =>
    generatePassword(length)
  )

  ipcMain.handle('auth:getActiveProfile', () =>
    accountManager.getActiveProfileId()
  )

  logger.auth.info('Auth IPC handlers registered')
}
