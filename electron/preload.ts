import { contextBridge, ipcRenderer } from 'electron'

// ============================================================
// FXRK Browser - Preload Script
// Exposes a safe, typed API to the renderer via contextBridge.
// NEVER expose ipcRenderer directly — always wrap in specific methods.
// ============================================================

const api = {
  // ── Tab Management ────────────────────────────────────────
  tabs: {
    create: (opts?: { url?: string; containerId?: string | null; profileId?: string; background?: boolean }) =>
      ipcRenderer.invoke('tab:create', opts),
    close: (tabId: string) => ipcRenderer.invoke('tab:close', tabId),
    switch: (tabId: string) => ipcRenderer.invoke('tab:switch', tabId),
    pin: (tabId: string, pinned: boolean) => ipcRenderer.invoke('tab:pin', tabId, pinned),
    mute: (tabId: string, muted: boolean) => ipcRenderer.invoke('tab:mute', tabId, muted),
    duplicate: (tabId: string) => ipcRenderer.invoke('tab:duplicate', tabId),
    onUpdate: (cb: (tab: Partial<{ id: string } & Record<string, unknown>>) => void) => {
      ipcRenderer.on('tab:update', (_, data) => cb(data))
      return () => ipcRenderer.removeAllListeners('tab:update')
    },
  },

  // ── Navigation ────────────────────────────────────────────
  navigate: {
    to: (tabId: string, url: string) => ipcRenderer.invoke('navigate', tabId, url),
    back: (tabId: string) => ipcRenderer.invoke('navigate:back', tabId),
    forward: (tabId: string) => ipcRenderer.invoke('navigate:forward', tabId),
    refresh: (tabId: string) => ipcRenderer.invoke('navigate:refresh', tabId),
    stop: (tabId: string) => ipcRenderer.invoke('navigate:stop', tabId),
    home: (tabId: string) => ipcRenderer.invoke('navigate:home', tabId),
  },

  // ── Privacy ───────────────────────────────────────────────
  privacy: {
    getSettings: () => ipcRenderer.invoke('privacy:getSettings'),
    setSettings: (partial: Record<string, unknown>) => ipcRenderer.invoke('privacy:setSettings', partial),
    getBlockedCount: () => ipcRenderer.invoke('privacy:getBlockedCount'),
    getBlockedForTab: (tabId: string) => ipcRenderer.invoke('privacy:blockedForTab', tabId),
    toggleSite: (domain: string, enabled: boolean) => ipcRenderer.invoke('privacy:toggleSite', domain, enabled),
    getGrade: (url: string, count: number, https: boolean) => ipcRenderer.invoke('privacy:getGrade', url, count, https),
    clearCookies: (partition?: string) => ipcRenderer.invoke('privacy:clearCookies', partition),
    getCookies: (url: string, partition?: string) => ipcRenderer.invoke('privacy:getCookies', url, partition),
  },

  // ── User Agent ────────────────────────────────────────────
  userAgent: {
    getSettings: () => ipcRenderer.invoke('ua:getSettings'),
    getPresets: () => ipcRenderer.invoke('ua:getPresets'),
    updateSettings: (partial: Record<string, unknown>) => ipcRenderer.invoke('ua:updateSettings', partial),
    setSiteRule: (domain: string, uaId: string | null) => ipcRenderer.invoke('ua:setSiteRule', domain, uaId),
  },

  // ── Auth & Accounts ───────────────────────────────────────
  auth: {
    getAccounts: () => ipcRenderer.invoke('auth:getAccounts'),
    addAccount: (provider: string, config: Record<string, unknown>) =>
      ipcRenderer.invoke('auth:addAccount', provider, config),
    removeAccount: (id: string) => ipcRenderer.invoke('auth:removeAccount', id),
    getProfiles: () => ipcRenderer.invoke('auth:getProfiles'),
    switchProfile: (id: string) => ipcRenderer.invoke('auth:switchProfile', id),
    createProfile: (name: string, avatar?: string, color?: string) =>
      ipcRenderer.invoke('auth:createProfile', name, avatar, color),
    deleteProfile: (id: string) => ipcRenderer.invoke('profile:delete', id),
    lockProfile: (id: string, password: string) => ipcRenderer.invoke('profile:lock', id, password),
    unlockProfile: (id: string, password: string) => ipcRenderer.invoke('profile:unlock', id, password),
    getCredentials: () => ipcRenderer.invoke('auth:getCredentials'),
    getCredentialsForDomain: (domain: string) => ipcRenderer.invoke('auth:getCredentialsForDomain', domain),
    saveCredential: (cred: Record<string, unknown>) => ipcRenderer.invoke('auth:saveCredential', cred),
    deleteCredential: (id: string) => ipcRenderer.invoke('auth:deleteCredential', id),
    generatePassword: (length?: number) => ipcRenderer.invoke('auth:generatePassword', length),
    getActiveProfile: () => ipcRenderer.invoke('auth:getActiveProfile'),
  },

  // ── Phone Bridge ──────────────────────────────────────────
  phone: {
    connect: (config: Record<string, unknown>) => ipcRenderer.invoke('phone:connect', config),
    disconnect: () => ipcRenderer.invoke('phone:disconnect'),
    getStatus: () => ipcRenderer.invoke('phone:getStatus'),
    getConversations: () => ipcRenderer.invoke('phone:getConversations'),
    getMessages: (convId: string) => ipcRenderer.invoke('phone:getMessages', convId),
    sendMessage: (to: string, text: string) => ipcRenderer.invoke('phone:sendMessage', to, text),
    sendLink: (url: string) => ipcRenderer.invoke('phone:sendLink', url),
    sendNote: (content: string, title?: string) => ipcRenderer.invoke('phone:sendNote', content, title),
    syncClipboard: (direction: 'toPhone' | 'fromPhone') => ipcRenderer.invoke('phone:syncClipboard', direction),
    submit2FA: (code: string) => ipcRenderer.send('phone:submit2FA', code),
    getConfig: () => ipcRenderer.invoke('phone:getConfig'),
    autoReconnect: () => ipcRenderer.invoke('phone:autoReconnect'),
    startClipboardSync: () => ipcRenderer.send('phone:startClipboardSync'),
    stopClipboardSync: () => ipcRenderer.send('phone:stopClipboardSync'),
    onStatusChange: (cb: (status: Record<string, unknown>) => void) => {
      ipcRenderer.on('phone:statusChange', (_, s) => cb(s))
      return () => ipcRenderer.removeAllListeners('phone:statusChange')
    },
    onNewMessage: (cb: (msg: Record<string, unknown>) => void) => {
      ipcRenderer.on('phone:newMessage', (_, m) => cb(m))
      return () => ipcRenderer.removeAllListeners('phone:newMessage')
    },
    onConversationsUpdated: (cb: (convs: Record<string, unknown>[]) => void) => {
      ipcRenderer.on('phone:conversationsUpdated', (_, c) => cb(c))
      return () => ipcRenderer.removeAllListeners('phone:conversationsUpdated')
    },
    onCodeDetected: (cb: (alert: Record<string, unknown>) => void) => {
      ipcRenderer.on('phone:codeDetected', (_, a) => cb(a))
      return () => ipcRenderer.removeAllListeners('phone:codeDetected')
    },
    on2FARequired: (cb: () => void) => {
      ipcRenderer.on('phone:2faRequired', cb)
      return () => ipcRenderer.removeAllListeners('phone:2faRequired')
    },
    onClipboardFromPhone: (cb: (text: string) => void) => {
      ipcRenderer.on('phone:clipboardFromPhone', (_, t) => cb(t))
      return () => ipcRenderer.removeAllListeners('phone:clipboardFromPhone')
    },
  },

  // ── Settings ──────────────────────────────────────────────
  settings: {
    get: (key?: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    reset: () => ipcRenderer.invoke('settings:reset'),
    export: () => ipcRenderer.invoke('settings:export'),
    import: () => ipcRenderer.invoke('settings:import'),
  },

  // ── Bookmarks ─────────────────────────────────────────────
  bookmarks: {
    get: (profileId: string) => ipcRenderer.invoke('bookmarks:get', profileId),
    add: (bookmark: Record<string, unknown>) => ipcRenderer.invoke('bookmarks:add', bookmark),
    delete: (id: string) => ipcRenderer.invoke('bookmarks:delete', id),
    isBookmarked: (url: string, profileId: string) => ipcRenderer.invoke('bookmarks:isBookmarked', url, profileId),
    getFolders: (profileId: string) => ipcRenderer.invoke('bookmarks:getFolders', profileId),
    addFolder: (folder: Record<string, unknown>) => ipcRenderer.invoke('bookmarks:addFolder', folder),
    importHTML: (profileId: string) => ipcRenderer.invoke('bookmarks:importHTML', profileId),
  },

  // ── History ───────────────────────────────────────────────
  history: {
    get: (profileId: string, limit?: number, offset?: number) =>
      ipcRenderer.invoke('history:get', profileId, limit, offset),
    search: (profileId: string, query: string) =>
      ipcRenderer.invoke('history:search', profileId, query),
    clear: (profileId: string, before?: number) =>
      ipcRenderer.invoke('history:clear', profileId, before),
    delete: (id: string) => ipcRenderer.invoke('history:delete', id),
  },

  // ── Downloads ─────────────────────────────────────────────
  downloads: {
    get: () => ipcRenderer.invoke('downloads:get'),
    open: (savePath: string) => ipcRenderer.invoke('downloads:open', savePath),
    openFolder: (savePath: string) => ipcRenderer.invoke('downloads:openFolder', savePath),
    onItem: (cb: (download: Record<string, unknown>) => void) => {
      ipcRenderer.on('download:item', (_, d) => cb(d))
      return () => ipcRenderer.removeAllListeners('download:item')
    },
  },

  // ── Notes ─────────────────────────────────────────────────
  notes: {
    get: (url: string, profileId: string) => ipcRenderer.invoke('notes:get', url, profileId),
    save: (note: Record<string, unknown>) => ipcRenderer.invoke('notes:save', note),
    delete: (id: string) => ipcRenderer.invoke('notes:delete', id),
  },

  // ── Find in Page ──────────────────────────────────────────
  find: {
    search: (tabId: string, query: string, opts?: Record<string, unknown>) =>
      ipcRenderer.invoke('find:inPage', tabId, query, opts),
    stop: (tabId: string) => ipcRenderer.invoke('find:stop', tabId),
    onResult: (cb: (result: Record<string, unknown>) => void) => {
      ipcRenderer.on('find:result', (_, r) => cb(r))
      return () => ipcRenderer.removeAllListeners('find:result')
    },
  },

  // ── DevTools ──────────────────────────────────────────────
  devtools: {
    open: (tabId: string) => ipcRenderer.invoke('devtools:open', tabId),
  },

  // ── Screenshot ────────────────────────────────────────────
  screenshot: {
    capture: (tabId: string, type?: 'visible' | 'full') =>
      ipcRenderer.invoke('screenshot:capture', tabId, type),
  },

  // ── Zoom ──────────────────────────────────────────────────
  zoom: {
    set: (tabId: string, level: number) => ipcRenderer.invoke('zoom:set', tabId, level),
    get: (tabId: string) => ipcRenderer.invoke('zoom:get', tabId),
  },

  // ── Clipboard ─────────────────────────────────────────────
  clipboard: {
    write: (text: string) => ipcRenderer.invoke('clipboard:write', text),
    read: () => ipcRenderer.invoke('clipboard:read'),
  },

  // ── Session ───────────────────────────────────────────────
  session: {
    save: (tabs: unknown[], profileId: string) => ipcRenderer.invoke('session:save', tabs, profileId),
    restore: (profileId: string) => ipcRenderer.invoke('session:restore', profileId),
    popClosedTab: (profileId: string) => ipcRenderer.invoke('session:closedTabPop', profileId),
  },

  // ── Window Controls ───────────────────────────────────────
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximized: (cb: (isMax: boolean) => void) => {
      ipcRenderer.on('window:maximized', (_, v) => cb(v))
      return () => ipcRenderer.removeAllListeners('window:maximized')
    },
    onResize: (cb: (size: [number, number]) => void) => {
      ipcRenderer.on('window:resize', (_, s) => cb(s))
      return () => ipcRenderer.removeAllListeners('window:resize')
    },
    setViewBounds: (bounds: { x: number; y: number; width: number; height: number }) => {
      ipcRenderer.send('layout:viewBounds', bounds)
    },
  },

  // ── App Events ────────────────────────────────────────────
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
    openPath: (p: string) => ipcRenderer.invoke('app:openPath', p),
    getDefaultDownloadPath: () => ipcRenderer.invoke('app:getDefaultDownloadPath'),
    onBeforeClose: (cb: () => void) => {
      ipcRenderer.on('app:beforeClose', cb)
      return () => ipcRenderer.removeAllListeners('app:beforeClose')
    },
    onSaveSession: (cb: () => void) => {
      ipcRenderer.on('app:saveSession', cb)
      return () => ipcRenderer.removeAllListeners('app:saveSession')
    },
    onOpenNewTab: (cb: (url: string) => void) => {
      ipcRenderer.on('browser:openNewTab', (_, url) => cb(url))
      return () => ipcRenderer.removeAllListeners('browser:openNewTab')
    },
    onShortcut: (action: string, cb: () => void) => {
      ipcRenderer.on(`shortcut:${action}`, cb)
      return () => ipcRenderer.removeAllListeners(`shortcut:${action}`)
    },
  },

  // ── Custom Filters ────────────────────────────────────────
  filters: {
    get: () => ipcRenderer.invoke('filters:get'),
    save: (filter: Record<string, unknown>) => ipcRenderer.invoke('filters:save', filter),
  },
}

// Expose the API on window.fxrk in the renderer process
contextBridge.exposeInMainWorld('fxrk', api)

// TypeScript declaration for window.fxrk (consumed in src/)
export type FXRKApi = typeof api
