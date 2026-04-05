"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// ============================================================
// FXRK Browser - Preload Script
// Exposes a safe, typed API to the renderer via contextBridge.
// NEVER expose ipcRenderer directly — always wrap in specific methods.
// ============================================================
const api = {
    // ── Tab Management ────────────────────────────────────────
    tabs: {
        create: (opts) => electron_1.ipcRenderer.invoke('tab:create', opts),
        close: (tabId) => electron_1.ipcRenderer.invoke('tab:close', tabId),
        switch: (tabId) => electron_1.ipcRenderer.invoke('tab:switch', tabId),
        pin: (tabId, pinned) => electron_1.ipcRenderer.invoke('tab:pin', tabId, pinned),
        mute: (tabId, muted) => electron_1.ipcRenderer.invoke('tab:mute', tabId, muted),
        duplicate: (tabId) => electron_1.ipcRenderer.invoke('tab:duplicate', tabId),
        onUpdate: (cb) => {
            electron_1.ipcRenderer.on('tab:update', (_, data) => cb(data));
            return () => electron_1.ipcRenderer.removeAllListeners('tab:update');
        },
    },
    // ── Navigation ────────────────────────────────────────────
    navigate: {
        to: (tabId, url) => electron_1.ipcRenderer.invoke('navigate', tabId, url),
        back: (tabId) => electron_1.ipcRenderer.invoke('navigate:back', tabId),
        forward: (tabId) => electron_1.ipcRenderer.invoke('navigate:forward', tabId),
        refresh: (tabId) => electron_1.ipcRenderer.invoke('navigate:refresh', tabId),
        stop: (tabId) => electron_1.ipcRenderer.invoke('navigate:stop', tabId),
        home: (tabId) => electron_1.ipcRenderer.invoke('navigate:home', tabId),
    },
    // ── Privacy ───────────────────────────────────────────────
    privacy: {
        getSettings: () => electron_1.ipcRenderer.invoke('privacy:getSettings'),
        setSettings: (partial) => electron_1.ipcRenderer.invoke('privacy:setSettings', partial),
        getBlockedCount: () => electron_1.ipcRenderer.invoke('privacy:getBlockedCount'),
        getBlockedForTab: (tabId) => electron_1.ipcRenderer.invoke('privacy:blockedForTab', tabId),
        toggleSite: (domain, enabled) => electron_1.ipcRenderer.invoke('privacy:toggleSite', domain, enabled),
        getGrade: (url, count, https) => electron_1.ipcRenderer.invoke('privacy:getGrade', url, count, https),
        clearCookies: (partition) => electron_1.ipcRenderer.invoke('privacy:clearCookies', partition),
        getCookies: (url, partition) => electron_1.ipcRenderer.invoke('privacy:getCookies', url, partition),
    },
    // ── User Agent ────────────────────────────────────────────
    userAgent: {
        getSettings: () => electron_1.ipcRenderer.invoke('ua:getSettings'),
        getPresets: () => electron_1.ipcRenderer.invoke('ua:getPresets'),
        updateSettings: (partial) => electron_1.ipcRenderer.invoke('ua:updateSettings', partial),
        setSiteRule: (domain, uaId) => electron_1.ipcRenderer.invoke('ua:setSiteRule', domain, uaId),
    },
    // ── Auth & Accounts ───────────────────────────────────────
    auth: {
        getAccounts: () => electron_1.ipcRenderer.invoke('auth:getAccounts'),
        addAccount: (provider, config) => electron_1.ipcRenderer.invoke('auth:addAccount', provider, config),
        removeAccount: (id) => electron_1.ipcRenderer.invoke('auth:removeAccount', id),
        getProfiles: () => electron_1.ipcRenderer.invoke('auth:getProfiles'),
        switchProfile: (id) => electron_1.ipcRenderer.invoke('auth:switchProfile', id),
        createProfile: (name, avatar, color) => electron_1.ipcRenderer.invoke('auth:createProfile', name, avatar, color),
        deleteProfile: (id) => electron_1.ipcRenderer.invoke('profile:delete', id),
        lockProfile: (id, password) => electron_1.ipcRenderer.invoke('profile:lock', id, password),
        unlockProfile: (id, password) => electron_1.ipcRenderer.invoke('profile:unlock', id, password),
        getCredentials: () => electron_1.ipcRenderer.invoke('auth:getCredentials'),
        getCredentialsForDomain: (domain) => electron_1.ipcRenderer.invoke('auth:getCredentialsForDomain', domain),
        saveCredential: (cred) => electron_1.ipcRenderer.invoke('auth:saveCredential', cred),
        deleteCredential: (id) => electron_1.ipcRenderer.invoke('auth:deleteCredential', id),
        generatePassword: (length) => electron_1.ipcRenderer.invoke('auth:generatePassword', length),
        getActiveProfile: () => electron_1.ipcRenderer.invoke('auth:getActiveProfile'),
    },
    // ── Phone Bridge ──────────────────────────────────────────
    phone: {
        connect: (config) => electron_1.ipcRenderer.invoke('phone:connect', config),
        disconnect: () => electron_1.ipcRenderer.invoke('phone:disconnect'),
        getStatus: () => electron_1.ipcRenderer.invoke('phone:getStatus'),
        getConversations: () => electron_1.ipcRenderer.invoke('phone:getConversations'),
        getMessages: (convId) => electron_1.ipcRenderer.invoke('phone:getMessages', convId),
        sendMessage: (to, text) => electron_1.ipcRenderer.invoke('phone:sendMessage', to, text),
        sendLink: (url) => electron_1.ipcRenderer.invoke('phone:sendLink', url),
        sendNote: (content, title) => electron_1.ipcRenderer.invoke('phone:sendNote', content, title),
        syncClipboard: (direction) => electron_1.ipcRenderer.invoke('phone:syncClipboard', direction),
        submit2FA: (code) => electron_1.ipcRenderer.send('phone:submit2FA', code),
        getConfig: () => electron_1.ipcRenderer.invoke('phone:getConfig'),
        autoReconnect: () => electron_1.ipcRenderer.invoke('phone:autoReconnect'),
        startClipboardSync: () => electron_1.ipcRenderer.send('phone:startClipboardSync'),
        stopClipboardSync: () => electron_1.ipcRenderer.send('phone:stopClipboardSync'),
        onStatusChange: (cb) => {
            electron_1.ipcRenderer.on('phone:statusChange', (_, s) => cb(s));
            return () => electron_1.ipcRenderer.removeAllListeners('phone:statusChange');
        },
        onNewMessage: (cb) => {
            electron_1.ipcRenderer.on('phone:newMessage', (_, m) => cb(m));
            return () => electron_1.ipcRenderer.removeAllListeners('phone:newMessage');
        },
        onConversationsUpdated: (cb) => {
            electron_1.ipcRenderer.on('phone:conversationsUpdated', (_, c) => cb(c));
            return () => electron_1.ipcRenderer.removeAllListeners('phone:conversationsUpdated');
        },
        onCodeDetected: (cb) => {
            electron_1.ipcRenderer.on('phone:codeDetected', (_, a) => cb(a));
            return () => electron_1.ipcRenderer.removeAllListeners('phone:codeDetected');
        },
        on2FARequired: (cb) => {
            electron_1.ipcRenderer.on('phone:2faRequired', cb);
            return () => electron_1.ipcRenderer.removeAllListeners('phone:2faRequired');
        },
        onClipboardFromPhone: (cb) => {
            electron_1.ipcRenderer.on('phone:clipboardFromPhone', (_, t) => cb(t));
            return () => electron_1.ipcRenderer.removeAllListeners('phone:clipboardFromPhone');
        },
    },
    // ── Settings ──────────────────────────────────────────────
    settings: {
        get: (key) => electron_1.ipcRenderer.invoke('settings:get', key),
        set: (key, value) => electron_1.ipcRenderer.invoke('settings:set', key, value),
        reset: () => electron_1.ipcRenderer.invoke('settings:reset'),
        export: () => electron_1.ipcRenderer.invoke('settings:export'),
        import: () => electron_1.ipcRenderer.invoke('settings:import'),
    },
    // ── Bookmarks ─────────────────────────────────────────────
    bookmarks: {
        get: (profileId) => electron_1.ipcRenderer.invoke('bookmarks:get', profileId),
        add: (bookmark) => electron_1.ipcRenderer.invoke('bookmarks:add', bookmark),
        delete: (id) => electron_1.ipcRenderer.invoke('bookmarks:delete', id),
        isBookmarked: (url, profileId) => electron_1.ipcRenderer.invoke('bookmarks:isBookmarked', url, profileId),
        getFolders: (profileId) => electron_1.ipcRenderer.invoke('bookmarks:getFolders', profileId),
        addFolder: (folder) => electron_1.ipcRenderer.invoke('bookmarks:addFolder', folder),
        importHTML: (profileId) => electron_1.ipcRenderer.invoke('bookmarks:importHTML', profileId),
    },
    // ── History ───────────────────────────────────────────────
    history: {
        get: (profileId, limit, offset) => electron_1.ipcRenderer.invoke('history:get', profileId, limit, offset),
        search: (profileId, query) => electron_1.ipcRenderer.invoke('history:search', profileId, query),
        clear: (profileId, before) => electron_1.ipcRenderer.invoke('history:clear', profileId, before),
        delete: (id) => electron_1.ipcRenderer.invoke('history:delete', id),
    },
    // ── Downloads ─────────────────────────────────────────────
    downloads: {
        get: () => electron_1.ipcRenderer.invoke('downloads:get'),
        open: (savePath) => electron_1.ipcRenderer.invoke('downloads:open', savePath),
        openFolder: (savePath) => electron_1.ipcRenderer.invoke('downloads:openFolder', savePath),
        onItem: (cb) => {
            electron_1.ipcRenderer.on('download:item', (_, d) => cb(d));
            return () => electron_1.ipcRenderer.removeAllListeners('download:item');
        },
    },
    // ── Notes ─────────────────────────────────────────────────
    notes: {
        get: (url, profileId) => electron_1.ipcRenderer.invoke('notes:get', url, profileId),
        save: (note) => electron_1.ipcRenderer.invoke('notes:save', note),
        delete: (id) => electron_1.ipcRenderer.invoke('notes:delete', id),
    },
    // ── Find in Page ──────────────────────────────────────────
    find: {
        search: (tabId, query, opts) => electron_1.ipcRenderer.invoke('find:inPage', tabId, query, opts),
        stop: (tabId) => electron_1.ipcRenderer.invoke('find:stop', tabId),
        onResult: (cb) => {
            electron_1.ipcRenderer.on('find:result', (_, r) => cb(r));
            return () => electron_1.ipcRenderer.removeAllListeners('find:result');
        },
    },
    // ── DevTools ──────────────────────────────────────────────
    devtools: {
        open: (tabId) => electron_1.ipcRenderer.invoke('devtools:open', tabId),
    },
    // ── Screenshot ────────────────────────────────────────────
    screenshot: {
        capture: (tabId, type) => electron_1.ipcRenderer.invoke('screenshot:capture', tabId, type),
    },
    // ── Zoom ──────────────────────────────────────────────────
    zoom: {
        set: (tabId, level) => electron_1.ipcRenderer.invoke('zoom:set', tabId, level),
        get: (tabId) => electron_1.ipcRenderer.invoke('zoom:get', tabId),
    },
    // ── Clipboard ─────────────────────────────────────────────
    clipboard: {
        write: (text) => electron_1.ipcRenderer.invoke('clipboard:write', text),
        read: () => electron_1.ipcRenderer.invoke('clipboard:read'),
    },
    // ── Session ───────────────────────────────────────────────
    session: {
        save: (tabs, profileId) => electron_1.ipcRenderer.invoke('session:save', tabs, profileId),
        restore: (profileId) => electron_1.ipcRenderer.invoke('session:restore', profileId),
        popClosedTab: (profileId) => electron_1.ipcRenderer.invoke('session:closedTabPop', profileId),
    },
    // ── Window Controls ───────────────────────────────────────
    window: {
        minimize: () => electron_1.ipcRenderer.send('window:minimize'),
        maximize: () => electron_1.ipcRenderer.send('window:maximize'),
        close: () => electron_1.ipcRenderer.send('window:close'),
        isMaximized: () => electron_1.ipcRenderer.invoke('window:isMaximized'),
        onMaximized: (cb) => {
            electron_1.ipcRenderer.on('window:maximized', (_, v) => cb(v));
            return () => electron_1.ipcRenderer.removeAllListeners('window:maximized');
        },
        onResize: (cb) => {
            electron_1.ipcRenderer.on('window:resize', (_, s) => cb(s));
            return () => electron_1.ipcRenderer.removeAllListeners('window:resize');
        },
        setViewBounds: (bounds) => {
            electron_1.ipcRenderer.send('layout:viewBounds', bounds);
        },
    },
    // ── App Events ────────────────────────────────────────────
    app: {
        getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
        openExternal: (url) => electron_1.ipcRenderer.invoke('app:openExternal', url),
        openPath: (p) => electron_1.ipcRenderer.invoke('app:openPath', p),
        getDefaultDownloadPath: () => electron_1.ipcRenderer.invoke('app:getDefaultDownloadPath'),
        onBeforeClose: (cb) => {
            electron_1.ipcRenderer.on('app:beforeClose', cb);
            return () => electron_1.ipcRenderer.removeAllListeners('app:beforeClose');
        },
        onSaveSession: (cb) => {
            electron_1.ipcRenderer.on('app:saveSession', cb);
            return () => electron_1.ipcRenderer.removeAllListeners('app:saveSession');
        },
        onOpenNewTab: (cb) => {
            electron_1.ipcRenderer.on('browser:openNewTab', (_, url) => cb(url));
            return () => electron_1.ipcRenderer.removeAllListeners('browser:openNewTab');
        },
        onShortcut: (action, cb) => {
            electron_1.ipcRenderer.on(`shortcut:${action}`, cb);
            return () => electron_1.ipcRenderer.removeAllListeners(`shortcut:${action}`);
        },
    },
    // ── Custom Filters ────────────────────────────────────────
    filters: {
        get: () => electron_1.ipcRenderer.invoke('filters:get'),
        save: (filter) => electron_1.ipcRenderer.invoke('filters:save', filter),
    },
};
// Expose the API on window.fxrk in the renderer process
electron_1.contextBridge.exposeInMainWorld('fxrk', api);
//# sourceMappingURL=preload.js.map