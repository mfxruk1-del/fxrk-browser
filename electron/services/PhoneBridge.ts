import * as puppeteer from 'puppeteer-core'
import type { Browser, Page, Protocol } from 'puppeteer-core'
import { BrowserWindow } from 'electron'
import { EventEmitter } from 'events'
import * as path from 'path'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'
import { db } from './DatabaseService'
import { ICLOUD_URLS, PHONE_POLL_INTERVAL } from '../utils/constants'
import type {
  SMSMessage, SMSConversation, PhoneBridgeConfig,
  PhoneBridgeStatus, VerificationCodeAlert,
} from '../utils/types'

// ============================================================
// FXRK Browser - Phone Bridge (iCloud SMS via Puppeteer)
// Connects to iCloud.com/messages using headless Chromium,
// detects SMS messages and verification codes in real-time.
// ============================================================

// Regex patterns for verification code detection
const CODE_PATTERNS = [
  /\b(\d{6})\b/,                                // 6-digit numeric (most common)
  /\b(\d{4})\b/,                                // 4-digit numeric
  /\b([A-Z0-9]{4,8})\b/,                        // alphanumeric codes
  /code[:\s]+([A-Z0-9]{4,8})/i,                 // "code: XXXX"
  /verification[:\s]+([A-Z0-9]{4,8})/i,         // "verification: XXXX"
]

// Keywords indicating a message contains a verification code
const CODE_KEYWORDS = [
  'verification', 'verify', 'code', 'otp', 'one-time', 'one time',
  'confirm', 'authenticate', 'login code', '2fa', 'two-factor',
  'passcode', 'security code', 'access code',
]

type ConversationMap = Map<string, SMSConversation>

class PhoneBridge extends EventEmitter {
  private browser: Browser | null = null
  private page: Page | null = null
  private status: PhoneBridgeStatus = { connected: false, authenticating: false }
  private conversations: ConversationMap = new Map()
  private pollTimer: NodeJS.Timeout | null = null
  private sessionRestored = false
  private mainWindow: BrowserWindow | null = null

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win
  }

  getStatus(): PhoneBridgeStatus {
    return { ...this.status }
  }

  getConversations(): SMSConversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
  }

  getMessages(conversationId: string): SMSMessage[] {
    return this.conversations.get(conversationId)?.messages ?? []
  }

  /** Connect to iCloud and open Messages */
  async connect(config: PhoneBridgeConfig): Promise<void> {
    if (this.status.connected || this.status.authenticating) return

    this.status = { connected: false, authenticating: true }
    this.emit('statusChange', this.status)

    try {
      // Find Chrome/Edge installation for puppeteer to use
      const chromePath = this.findChromePath()
      if (!chromePath) {
        throw new Error(
          'Chrome/Edge not found. Please install Google Chrome to use phone integration.'
        )
      }

      logger.phone.info(`Launching headless browser: ${chromePath}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pup = puppeteer as any
      const launch = pup.default?.launch || pup.launch
      this.browser = await launch({
        executablePath: chromePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1280,800',
        ],
        defaultViewport: { width: 1280, height: 800 },
      })

      if (!this.browser) throw new Error('Browser failed to launch')
      this.page = await this.browser.newPage()
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Try to restore saved session cookies first
      if (config.sessionCookies) {
        await this.restoreSession(config.sessionCookies)
      }

      // Navigate to iCloud
      await this.page.goto(ICLOUD_URLS.login, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      // Check if already logged in (session cookie worked)
      const isLoggedIn = await this.checkLoggedIn()

      if (!isLoggedIn) {
        // Perform login
        await this.performLogin(config.appleId, config.appSpecificPassword)
      }

      // Navigate to Messages
      await this.openMessages()

      // Save current session cookies
      const cookies = await this.saveSession()
      db.savePhoneConfig({ ...config, sessionCookies: cookies, lastConnected: Date.now() })

      this.status = { connected: true, authenticating: false, lastSync: Date.now() }
      this.emit('statusChange', this.status)

      // Set up real-time message observer
      await this.setupMessageObserver()

      // Start fallback polling
      this.startPolling()

      logger.phone.info('Phone bridge connected successfully')
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      logger.phone.error(`Connection failed: ${error}`)
      this.status = { connected: false, authenticating: false, error }
      this.emit('statusChange', this.status)
      await this.cleanup()
    }
  }

  /** Find Chrome or Edge executable on the system */
  private findChromePath(): string | null {
    const candidates = [
      // Windows - Chrome
      path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      // Windows - Edge (built-in on Win10/11)
      path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
      // Linux
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      // macOS
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ]

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate
    }
    return null
  }

  /** Check if the current session is authenticated on iCloud */
  private async checkLoggedIn(): Promise<boolean> {
    if (!this.page) return false
    const url = this.page.url()
    return url.includes('icloud.com') && !url.includes('/login')
  }

  /** Perform iCloud login with Apple ID and App-Specific Password */
  private async performLogin(appleId: string, password: string): Promise<void> {
    if (!this.page) throw new Error('No page available')

    logger.phone.info('Performing iCloud login...')

    // Wait for the Apple ID sign-in page (it uses a shadow DOM / iframe structure)
    await this.page.waitForSelector('#account_name_text_field, input[type="email"]', {
      timeout: 30000,
    }).catch(() => null)

    // Try direct form fill (Apple ID input)
    const appleIdInput = await this.page.$('#account_name_text_field') ||
                         await this.page.$('input[type="email"]')

    if (appleIdInput) {
      await appleIdInput.click({ clickCount: 3 })
      await appleIdInput.type(appleId, { delay: 50 })

      // Press Continue/Next
      const continueBtn = await this.page.$('#sign-in') ||
                          await this.page.$('button[type="submit"]')
      if (continueBtn) await continueBtn.click()

      await this.page.waitForTimeout(2000)

      // Enter password
      const passwordInput = await this.page.waitForSelector('#password_text_field, input[type="password"]', {
        timeout: 15000,
      })
      if (passwordInput) {
        await passwordInput.click({ clickCount: 3 })
        await passwordInput.type(password, { delay: 50 })

        const signInBtn = await this.page.$('#sign-in') ||
                          await this.page.$('button[type="submit"]')
        if (signInBtn) await signInBtn.click()
      }

      // Wait for redirect after login (could take a few seconds)
      await this.page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle2' })
        .catch(() => null)

      // Handle 2FA if prompted - emit event to show UI
      const is2FA = await this.page.$('#char0, #verification-code-field, input[inputmode="numeric"]')
        .then(el => el !== null)
        .catch(() => false)

      if (is2FA) {
        logger.phone.info('2FA required - waiting for code from user')
        this.emit('twoFactorRequired')

        // Wait up to 5 minutes for 2FA code to be provided
        const code = await new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('2FA timeout')), 5 * 60 * 1000)
          this.once('twoFactorCode', (code: string) => {
            clearTimeout(timeout)
            resolve(code)
          })
        })

        // Enter 2FA code
        const codeInputs = await this.page.$$('#char0, input[inputmode="numeric"], input[type="number"]')
        if (codeInputs.length > 0) {
          if (codeInputs.length === 1) {
            // Single field for entire code
            await codeInputs[0].type(code, { delay: 100 })
          } else {
            // Individual digit inputs
            for (let i = 0; i < Math.min(code.length, codeInputs.length); i++) {
              await codeInputs[i].type(code[i], { delay: 100 })
            }
          }
          await this.page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle2' })
            .catch(() => null)
        }
      }
    } else {
      throw new Error('Could not find Apple ID login form. iCloud page structure may have changed.')
    }

    logger.phone.info('Login completed')
  }

  /** Navigate to iCloud Messages */
  private async openMessages(): Promise<void> {
    if (!this.page) throw new Error('No page')
    logger.phone.info('Navigating to iCloud Messages...')

    await this.page.goto(ICLOUD_URLS.messages, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Wait for message list to appear
    await this.page.waitForSelector(
      '[class*="conversation"], [class*="message-list"], [class*="thread-list"], ul[role="listbox"]',
      { timeout: 20000 }
    ).catch(() => {
      logger.phone.warn('Message list selector not found — iCloud UI may have changed')
    })

    // Load initial conversations
    await this.loadConversations()
  }

  /** Load conversation list from iCloud Messages DOM */
  private async loadConversations(): Promise<void> {
    if (!this.page) return

    try {
      const conversations = await this.page.evaluate((): Array<{
        id: string
        name: string
        lastMessage: string
        time: string
      }> => {
        // iCloud Messages uses various class naming conventions - try several selectors
        const selectors = [
          '[class*="conversation-list"] li',
          '[class*="thread-list"] li',
          '[class*="message-list"] li',
          'ul[role="listbox"] li',
        ]

        for (const sel of selectors) {
          const items = document.querySelectorAll(sel)
          if (items.length > 0) {
            return Array.from(items).map((item, i) => ({
              id: item.getAttribute('data-id') || String(i),
              name: item.querySelector('[class*="name"], [class*="title"]')?.textContent?.trim() || 'Unknown',
              lastMessage: item.querySelector('[class*="preview"], [class*="snippet"], [class*="body"]')?.textContent?.trim() || '',
              time: item.querySelector('[class*="time"], [class*="date"]')?.textContent?.trim() || '',
            }))
          }
        }
        return []
      })

      for (const conv of conversations) {
        if (!this.conversations.has(conv.id)) {
          this.conversations.set(conv.id, {
            id: conv.id,
            participantNumber: conv.name,
            participantName: conv.name,
            lastMessage: conv.lastMessage,
            lastMessageTime: Date.now(),
            unreadCount: 0,
            messages: [],
          })
        }
      }

      this.emit('conversationsUpdated', this.getConversations())
      logger.phone.info(`Loaded ${conversations.length} conversations`)
    } catch (err) {
      logger.phone.warn(`Failed to load conversations: ${err}`)
    }
  }

  /** Set up a MutationObserver in the page for real-time message detection */
  private async setupMessageObserver(): Promise<void> {
    if (!this.page) return

    logger.phone.info('Setting up MutationObserver for real-time message detection...')

    await this.page.exposeFunction(
      'onNewMessageDetected',
      (sender: string, text: string, timestamp: number) => {
        this.handleNewMessage(sender, text, timestamp)
      }
    )

    await this.page.evaluate(() => {
      const observerTargetSelectors = [
        '[class*="message-list"]',
        '[class*="conversation-list"]',
        '[class*="thread-list"]',
        '[class*="messages"]',
        'main',
        'body',
      ]

      let observerTarget: Element | null = null
      for (const sel of observerTargetSelectors) {
        observerTarget = document.querySelector(sel)
        if (observerTarget) break
      }

      if (!observerTarget) {
        console.warn('[FXRK] Could not find message container for MutationObserver')
        return
      }

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue
            const el = node as Element

            // Try to extract message info from the added node
            const textEl = el.querySelector('[class*="body"], [class*="text"], [class*="content"]')
            const senderEl = el.querySelector('[class*="sender"], [class*="author"], [class*="name"]')
            const text = textEl?.textContent?.trim() || el.textContent?.trim() || ''
            const sender = senderEl?.textContent?.trim() || 'Unknown'

            if (text && text.length > 0) {
              // @ts-ignore - exposeFunction makes this available
              window.onNewMessageDetected(sender, text, Date.now())
            }
          }
        }
      })

      observer.observe(observerTarget, {
        childList: true,
        subtree: true,
        characterData: true,
      })

      console.log('[FXRK] MutationObserver attached to:', observerTarget.tagName, observerTarget.className.substring(0, 50))
    })

    logger.phone.info('MutationObserver set up successfully')
  }

  /** Handle a newly detected message */
  private handleNewMessage(sender: string, text: string, timestamp: number): void {
    const msgId = uuidv4()
    const convId = sender // Use sender as conversation ID

    const message: SMSMessage = {
      id: msgId,
      conversationId: convId,
      sender,
      text,
      timestamp,
      isOutgoing: false,
      hasVerificationCode: false,
    }

    // Detect verification codes
    const codeResult = this.detectVerificationCode(text)
    if (codeResult) {
      message.hasVerificationCode = true
      message.verificationCode = codeResult

      const alert: VerificationCodeAlert = {
        id: uuidv4(),
        code: codeResult,
        sender,
        messageText: text,
        detectedAt: Date.now(),
        copiedToClipboard: false,
        autoFilled: false,
      }

      logger.phone.info(`Verification code detected: ${codeResult} from ${sender}`)
      this.emit('verificationCodeDetected', alert)

      // Notify main window
      if (this.mainWindow) {
        this.mainWindow.webContents.send('phone:codeDetected', alert)
        this.mainWindow.flashFrame(true)
      }
    }

    // Update conversation
    if (!this.conversations.has(convId)) {
      this.conversations.set(convId, {
        id: convId,
        participantNumber: sender,
        participantName: sender,
        lastMessage: text,
        lastMessageTime: timestamp,
        unreadCount: 1,
        messages: [],
      })
    }

    const conv = this.conversations.get(convId)!
    conv.messages.push(message)
    conv.lastMessage = text
    conv.lastMessageTime = timestamp
    conv.unreadCount++

    this.emit('newMessage', message)
    this.emit('conversationsUpdated', this.getConversations())

    // Notify main window
    if (this.mainWindow) {
      this.mainWindow.webContents.send('phone:newMessage', message)
    }
  }

  /** Detect verification codes in a message text */
  private detectVerificationCode(text: string): string | null {
    const lowerText = text.toLowerCase()
    const hasKeyword = CODE_KEYWORDS.some(kw => lowerText.includes(kw))
    if (!hasKeyword) return null

    for (const pattern of CODE_PATTERNS) {
      const match = text.match(pattern)
      if (match) return match[1]
    }

    return null
  }

  /** Fallback polling in case MutationObserver fails */
  private startPolling(): void {
    this.pollTimer = setInterval(async () => {
      if (!this.status.connected || !this.page) return
      try {
        await this.loadConversations()
      } catch (err) {
        logger.phone.warn(`Polling error: ${err}`)
        // Check if session expired
        const url = this.page?.url() || ''
        if (url.includes('/login')) {
          logger.phone.warn('Session expired — notifying user')
          this.status = { connected: false, authenticating: false, error: 'Session expired' }
          this.emit('statusChange', this.status)
          if (this.mainWindow) {
            this.mainWindow.webContents.send('phone:sessionExpired')
          }
          this.stopPolling()
        }
      }
    }, PHONE_POLL_INTERVAL)
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  /** Send an SMS reply via iCloud.com/messages */
  async sendMessage(to: string, text: string): Promise<void> {
    if (!this.page || !this.status.connected) {
      throw new Error('Phone bridge not connected')
    }

    try {
      // Click on conversation with recipient
      await this.page.evaluate((recipient: string) => {
        const items = document.querySelectorAll('[class*="conversation"] li, [class*="thread"] li')
        for (const item of items) {
          if (item.textContent?.includes(recipient)) {
            (item as HTMLElement).click()
            return true
          }
        }
        return false
      }, to)

      await this.page.waitForTimeout(1000)

      // Find compose area and type message
      const composeArea = await this.page.$(
        'textarea[placeholder*="message"], textarea[placeholder*="iMessage"], [contenteditable="true"][class*="compose"]'
      )

      if (!composeArea) {
        throw new Error('Could not find message compose area')
      }

      await composeArea.click()
      await composeArea.type(text, { delay: 30 })

      // Send
      const sendBtn = await this.page.$('button[class*="send"], [aria-label*="Send"]')
      if (sendBtn) {
        await sendBtn.click()
      } else {
        await this.page.keyboard.press('Enter')
      }

      // Add to local conversation
      this.handleNewMessage('Me', text, Date.now())
      logger.phone.info(`Sent message to ${to}: ${text.substring(0, 50)}`)
    } catch (err) {
      logger.phone.error(`Failed to send message: ${err}`)
      throw err
    }
  }

  /** Create an iCloud Note (to send content to iPhone) */
  async sendToPhone(
    type: 'link' | 'note' | 'clipboard',
    content: string,
    title?: string
  ): Promise<void> {
    if (!this.page || !this.status.connected) {
      throw new Error('Phone bridge not connected')
    }

    const noteTitle = title || (type === 'clipboard' ? 'FXRK Clipboard' : `FXRK ${type === 'link' ? 'Link' : 'Note'}`)

    try {
      // Open iCloud Notes in a new page
      const notesPage = await this.browser!.newPage()
      await notesPage.goto(ICLOUD_URLS.notes, { waitUntil: 'networkidle2', timeout: 20000 })

      // Wait for notes interface
      await notesPage.waitForSelector('[class*="notes-app"], [class*="note-list"], button[aria-label*="New Note"]', {
        timeout: 15000,
      })

      // Click "New Note" button
      const newNoteBtn = await notesPage.$('button[aria-label*="New Note"], [class*="new-note"], [class*="compose"]')
      if (newNoteBtn) {
        await newNoteBtn.click()
        await notesPage.waitForTimeout(500)
      }

      // Find note content area and type
      const noteContent = await notesPage.$(
        '[contenteditable="true"], textarea[class*="content"], [class*="note-content"]'
      )

      if (noteContent) {
        await noteContent.click()
        await noteContent.type(noteTitle + '\n' + content, { delay: 20 })
        logger.phone.info(`Created iCloud Note: "${noteTitle}"`)
      }

      // Notes auto-save, but we can also trigger save
      await notesPage.keyboard.down('Meta')
      await notesPage.keyboard.press('s')
      await notesPage.keyboard.up('Meta')

      await notesPage.waitForTimeout(1000)
      await notesPage.close()
    } catch (err) {
      logger.phone.error(`Failed to create iCloud Note: ${err}`)
      throw err
    }
  }

  /** Check iCloud Notes for content pushed from phone (clipboard sync) */
  async checkPhoneClipboard(): Promise<string | null> {
    if (!this.browser || !this.status.connected) return null

    try {
      const notesPage = await this.browser.newPage()
      await notesPage.goto(ICLOUD_URLS.notes, { waitUntil: 'networkidle2', timeout: 15000 })

      const content = await notesPage.evaluate((): string | null => {
        const noteItems = document.querySelectorAll('[class*="note-list"] li, [class*="notes-list"] li')
        for (const item of noteItems) {
          const title = item.querySelector('[class*="title"], [class*="name"]')?.textContent || ''
          if (title.includes('FXRK To PC')) {
            const body = item.querySelector('[class*="body"], [class*="snippet"], [class*="preview"]')
            return body?.textContent?.trim() || null
          }
        }
        return null
      })

      await notesPage.close()
      return content
    } catch {
      return null
    }
  }

  /** Save session cookies for persistence across restarts */
  private async saveSession(): Promise<string> {
    if (!this.page) return ''
    const cookies: Protocol.Network.Cookie[] = await this.page.cookies()
    return JSON.stringify(cookies)
  }

  /** Restore session cookies */
  private async restoreSession(cookiesJson: string): Promise<void> {
    if (!this.page) return
    try {
      const cookies: Protocol.Network.Cookie[] = JSON.parse(cookiesJson)
      for (const cookie of cookies) {
        await this.page.setCookie(cookie).catch(() => {})
      }
      this.sessionRestored = true
      logger.phone.info(`Restored ${cookies.length} session cookies`)
    } catch {
      logger.phone.warn('Failed to restore session cookies')
    }
  }

  /** Provide 2FA code to the pending login flow */
  provide2FACode(code: string): void {
    this.emit('twoFactorCode', code)
  }

  /** Disconnect and cleanup */
  async disconnect(): Promise<void> {
    this.stopPolling()
    await this.cleanup()
    this.status = { connected: false, authenticating: false }
    this.emit('statusChange', this.status)
    logger.phone.info('Phone bridge disconnected')
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close().catch(() => {})
        this.page = null
      }
      if (this.browser) {
        await this.browser.close().catch(() => {})
        this.browser = null
      }
    } catch (err) {
      logger.phone.warn(`Cleanup error: ${err}`)
    }
  }
}

export const phoneBridge = new PhoneBridge()
export default phoneBridge
