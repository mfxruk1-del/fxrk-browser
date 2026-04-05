import { BrowserWindow, session } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'
import { db } from './DatabaseService'
import { generateState, hashPassword, verifyPassword } from '../utils/encryption'
import type { Account, Profile, Credential, OAuthProviderConfig } from '../utils/types'

// ============================================================
// FXRK Browser - Account Manager
// Handles OAuth flows, credentials, profiles, and sessions.
// ============================================================

// OAuth configurations for built-in providers
const OAUTH_CONFIGS: Record<string, Partial<OAuthProviderConfig>> = {
  google: {
    name: 'Google',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['openid', 'email', 'profile'],
  },
  microsoft: {
    name: 'Microsoft',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['openid', 'email', 'profile', 'offline_access'],
  },
  github: {
    name: 'GitHub',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['read:user', 'user:email'],
  },
  discord: {
    name: 'Discord',
    authorizationUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: ['identify', 'email'],
  },
  spotify: {
    name: 'Spotify',
    authorizationUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    scopes: ['user-read-email', 'user-read-private'],
  },
  reddit: {
    name: 'Reddit',
    authorizationUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    scopes: ['identity', 'read'],
  },
}

class AccountManager {
  private activeProfileId = 'default'
  private oauthStates = new Map<string, string>() // state → provider

  /** Get the currently active profile ID */
  getActiveProfileId(): string {
    return this.activeProfileId
  }

  // ── Profiles ─────────────────────────────────────────────

  getProfiles(): Profile[] {
    return db.getProfiles()
  }

  createProfile(name: string, avatar = '🦾', color = '#00ff41'): Profile {
    const id = uuidv4()
    const profile: Profile = {
      id,
      name,
      avatar,
      color,
      isLocked: false,
      createdAt: Date.now(),
      partition: `persist:profile-${id}`,
    }
    db.saveProfile(profile)
    logger.auth.info(`Created profile: ${name} (${id})`)
    return profile
  }

  deleteProfile(id: string): void {
    db.deleteProfile(id)
    if (this.activeProfileId === id) {
      this.activeProfileId = 'default'
    }
  }

  switchProfile(id: string): void {
    const profiles = db.getProfiles()
    const profile = profiles.find(p => p.id === id)
    if (!profile) throw new Error(`Profile ${id} not found`)
    this.activeProfileId = id
    logger.auth.info(`Switched to profile: ${profile.name}`)
  }

  lockProfile(id: string, password: string): void {
    const profiles = db.getProfiles()
    const profile = profiles.find(p => p.id === id)
    if (!profile) throw new Error('Profile not found')

    profile.isLocked = true
    profile.passwordHash = hashPassword(password)
    db.saveProfile(profile)
  }

  unlockProfile(id: string, password: string): boolean {
    const profiles = db.getProfiles()
    const profile = profiles.find(p => p.id === id)
    if (!profile || !profile.passwordHash) return false

    if (verifyPassword(password, profile.passwordHash)) {
      profile.isLocked = false
      db.saveProfile(profile)
      return true
    }
    return false
  }

  // ── OAuth ─────────────────────────────────────────────────

  /**
   * Opens a popup window for OAuth login.
   * Returns the account info once authentication is complete.
   */
  async loginWithOAuth(
    provider: string,
    config: OAuthProviderConfig
  ): Promise<Account> {
    return new Promise((resolve, reject) => {
      const state = generateState()
      this.oauthStates.set(state, provider)

      const redirectUri = 'fxrk://oauth/callback'
      const scope = config.scopes.join(' ')

      const authUrl = new URL(config.authorizationUrl)
      authUrl.searchParams.set('client_id', config.clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scope)
      authUrl.searchParams.set('state', state)
      if (provider === 'google') authUrl.searchParams.set('access_type', 'offline')
      if (provider === 'reddit') authUrl.searchParams.set('duration', 'permanent')

      const popup = new BrowserWindow({
        width: 500,
        height: 700,
        title: `Login with ${config.name}`,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          partition: `oauth-${provider}`, // Isolated session for OAuth
        },
        autoHideMenuBar: true,
        modal: true,
        show: true,
      })

      popup.loadURL(authUrl.toString()).catch(reject)

      // Intercept the redirect to fxrk://oauth/callback
      popup.webContents.on('will-navigate', async (_, url) => {
        await this.handleOAuthCallback(url, config, resolve, reject, popup)
      })

      popup.webContents.on('will-redirect', async (_, url) => {
        await this.handleOAuthCallback(url, config, resolve, reject, popup)
      })

      popup.on('closed', () => {
        reject(new Error('OAuth window closed by user'))
      })
    })
  }

  private async handleOAuthCallback(
    url: string,
    config: OAuthProviderConfig,
    resolve: (account: Account) => void,
    reject: (err: Error) => void,
    popup: BrowserWindow
  ): Promise<void> {
    if (!url.startsWith('fxrk://oauth/callback')) return

    try {
      const callbackUrl = new URL(url)
      const code = callbackUrl.searchParams.get('code')
      const state = callbackUrl.searchParams.get('state')
      const error = callbackUrl.searchParams.get('error')

      if (error) {
        popup.close()
        return reject(new Error(`OAuth error: ${error}`))
      }

      if (!code || !state || !this.oauthStates.has(state)) {
        popup.close()
        return reject(new Error('Invalid OAuth callback'))
      }

      const provider = this.oauthStates.get(state)!
      this.oauthStates.delete(state)

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, config)
      const userInfo = await this.fetchUserInfo(provider, tokens.access_token, tokens.id_token)

      const account: Account = {
        id: uuidv4(),
        provider: provider as Account['provider'],
        email: userInfo.email || '',
        displayName: userInfo.name || userInfo.login || userInfo.username || userInfo.display_name || '',
        avatarUrl: userInfo.picture || userInfo.avatar_url || userInfo.icon_img || '',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        tokenExpiry: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : 0,
        profileId: this.activeProfileId,
        providerConfig: config,
      }

      db.saveAccount(account)
      popup.close()
      logger.auth.info(`Logged in with ${provider}: ${account.email}`)
      resolve(account)
    } catch (err) {
      popup.close()
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  }

  private async exchangeCodeForTokens(
    code: string,
    config: OAuthProviderConfig
  ): Promise<{
    access_token: string
    refresh_token?: string
    id_token?: string
    expires_in?: number
  }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'fxrk://oauth/callback',
      client_id: config.clientId,
      client_secret: config.clientSecret,
    })

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${await response.text()}`)
    }

    return response.json() as Promise<{
      access_token: string
      refresh_token?: string
      id_token?: string
      expires_in?: number
    }>
  }

  private async fetchUserInfo(
    provider: string,
    accessToken: string,
    _idToken?: string
  ): Promise<Record<string, string>> {
    const userInfoUrls: Record<string, string> = {
      google: 'https://www.googleapis.com/oauth2/v3/userinfo',
      microsoft: 'https://graph.microsoft.com/oidc/userinfo',
      github: 'https://api.github.com/user',
      discord: 'https://discord.com/api/users/@me',
      spotify: 'https://api.spotify.com/v1/me',
      reddit: 'https://oauth.reddit.com/api/v1/me',
    }

    const url = userInfoUrls[provider]
    if (!url) return {}

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) return {}
    const data = await response.json() as Record<string, string>

    // Normalize reddit response
    if (provider === 'reddit' && data.icon_img) {
      data.avatar_url = data.icon_img.split('?')[0]
    }

    return data
  }

  getAccounts(): Account[] {
    return db.getAccounts(this.activeProfileId)
  }

  removeAccount(id: string): void {
    db.deleteAccount(id)
  }

  // ── Credentials ───────────────────────────────────────────

  getCredentials(): Credential[] {
    return db.getCredentials(this.activeProfileId)
  }

  getCredentialsForDomain(domain: string): Credential[] {
    return db.getCredentialsByDomain(domain, this.activeProfileId)
  }

  saveCredential(cred: Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'profileId'>): Credential {
    const fullCred: Credential = {
      ...cred,
      id: uuidv4(),
      profileId: this.activeProfileId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    db.saveCredential(fullCred)
    return fullCred
  }

  updateCredential(id: string, updates: Partial<Pick<Credential, 'username' | 'password' | 'notes'>>): void {
    const creds = db.getCredentials(this.activeProfileId)
    const cred = creds.find(c => c.id === id)
    if (!cred) return
    db.saveCredential({ ...cred, ...updates, updatedAt: Date.now() })
  }

  deleteCredential(id: string): void {
    db.deleteCredential(id)
  }
}

export const accountManager = new AccountManager()
export default accountManager
