import { session } from 'electron'
import { logger } from '../utils/logger'
import { db } from './DatabaseService'
import { UA_PRESETS } from '../utils/constants'
import type { UserAgentSettings, UserAgentPreset } from '../utils/types'

// ============================================================
// FXRK Browser - User Agent Manager
// ============================================================

class UserAgentManager {
  private settings: UserAgentSettings
  private presets: UserAgentPreset[] = UA_PRESETS
  private currentSessionUA: string = ''

  constructor() {
    this.settings = this.loadSettings()
    this.currentSessionUA = this.getActiveUserAgent()
  }

  private loadSettings(): UserAgentSettings {
    const defaults: UserAgentSettings = {
      defaultPreset: 'chrome-win',
      customUserAgent: '',
      autoRotate: false,
      siteSpecificRules: {},
    }
    try {
      return db.getSetting<UserAgentSettings>('userAgent', defaults)
    } catch {
      return defaults
    }
  }

  /** Re-load settings from DB (called after DB is initialized) */
  reloadSettings(): void {
    this.settings = this.loadSettings()
    this.currentSessionUA = this.getActiveUserAgent()
  }

  /** Get all built-in UA presets */
  getPresets(): UserAgentPreset[] {
    return this.presets
  }

  /** Get the currently active default user agent string */
  getActiveUserAgent(): string {
    if (this.settings.customUserAgent) {
      return this.settings.customUserAgent
    }

    const preset = this.presets.find(p => p.id === this.settings.defaultPreset)
    return preset?.userAgent ?? this.presets[0].userAgent
  }

  /** Get UA for a specific domain (site-specific rules take priority) */
  getUserAgentForDomain(domain: string): string | null {
    const siteUA = this.settings.siteSpecificRules[domain]
    if (siteUA) return siteUA

    // Auto-rotate: pick a random UA each call
    if (this.settings.autoRotate) {
      const randomPreset = this.presets[Math.floor(Math.random() * this.presets.length)]
      return randomPreset.userAgent
    }

    return null // Use global default
  }

  /** Apply the default UA to the Electron session */
  applyToSession(sess?: Electron.Session): void {
    const ua = this.getActiveUserAgent()
    const targetSession = sess || session.defaultSession
    targetSession.setUserAgent(ua)
    this.currentSessionUA = ua
    logger.info(`UA set: ${ua.substring(0, 80)}...`)
  }

  /** Set per-request UA based on site-specific rules */
  applyRequestUA(sess?: Electron.Session): void {
    const targetSession = sess || session.defaultSession
    const uaManager = this

    targetSession.webRequest.onBeforeSendHeaders(
      { urls: ['http://*/*', 'https://*/*'] },
      (details, callback) => {
        const headers = { ...details.requestHeaders }

        // Determine domain from URL
        try {
          const hostname = new URL(details.url).hostname
          const siteUA = uaManager.getUserAgentForDomain(hostname)
          if (siteUA) {
            headers['User-Agent'] = siteUA
          }
        } catch {
          // Ignore URL parse errors
        }

        callback({ requestHeaders: headers })
      }
    )
  }

  /** Update settings and reapply */
  updateSettings(partial: Partial<UserAgentSettings>): void {
    this.settings = { ...this.settings, ...partial }
    db.setSetting('userAgent', this.settings)
    this.applyToSession()
  }

  /** Set a per-site UA rule */
  setSiteRule(domain: string, uaId: string | null): void {
    if (uaId === null) {
      delete this.settings.siteSpecificRules[domain]
    } else {
      const preset = this.presets.find(p => p.id === uaId)
      this.settings.siteSpecificRules[domain] = preset?.userAgent ?? uaId
    }
    db.setSetting('userAgent', this.settings)
  }

  getSettings(): UserAgentSettings {
    return { ...this.settings }
  }

  getCurrentUA(): string {
    return this.currentSessionUA
  }
}

export const uaManager = new UserAgentManager()
export default uaManager
