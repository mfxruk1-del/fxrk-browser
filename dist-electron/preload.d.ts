declare const api: {
    tabs: {
        create: (opts?: {
            url?: string;
            containerId?: string | null;
            profileId?: string;
            background?: boolean;
        }) => Promise<any>;
        close: (tabId: string) => Promise<any>;
        switch: (tabId: string) => Promise<any>;
        pin: (tabId: string, pinned: boolean) => Promise<any>;
        mute: (tabId: string, muted: boolean) => Promise<any>;
        duplicate: (tabId: string) => Promise<any>;
        onUpdate: (cb: (tab: Partial<{
            id: string;
        } & Record<string, unknown>>) => void) => () => Electron.IpcRenderer;
    };
    navigate: {
        to: (tabId: string, url: string) => Promise<any>;
        back: (tabId: string) => Promise<any>;
        forward: (tabId: string) => Promise<any>;
        refresh: (tabId: string) => Promise<any>;
        stop: (tabId: string) => Promise<any>;
        home: (tabId: string) => Promise<any>;
    };
    privacy: {
        getSettings: () => Promise<any>;
        setSettings: (partial: Record<string, unknown>) => Promise<any>;
        getBlockedCount: () => Promise<any>;
        getBlockedForTab: (tabId: string) => Promise<any>;
        toggleSite: (domain: string, enabled: boolean) => Promise<any>;
        getGrade: (url: string, count: number, https: boolean) => Promise<any>;
        clearCookies: (partition?: string) => Promise<any>;
        getCookies: (url: string, partition?: string) => Promise<any>;
    };
    userAgent: {
        getSettings: () => Promise<any>;
        getPresets: () => Promise<any>;
        updateSettings: (partial: Record<string, unknown>) => Promise<any>;
        setSiteRule: (domain: string, uaId: string | null) => Promise<any>;
    };
    auth: {
        getAccounts: () => Promise<any>;
        addAccount: (provider: string, config: Record<string, unknown>) => Promise<any>;
        removeAccount: (id: string) => Promise<any>;
        getProfiles: () => Promise<any>;
        switchProfile: (id: string) => Promise<any>;
        createProfile: (name: string, avatar?: string, color?: string) => Promise<any>;
        deleteProfile: (id: string) => Promise<any>;
        lockProfile: (id: string, password: string) => Promise<any>;
        unlockProfile: (id: string, password: string) => Promise<any>;
        getCredentials: () => Promise<any>;
        getCredentialsForDomain: (domain: string) => Promise<any>;
        saveCredential: (cred: Record<string, unknown>) => Promise<any>;
        deleteCredential: (id: string) => Promise<any>;
        generatePassword: (length?: number) => Promise<any>;
        getActiveProfile: () => Promise<any>;
    };
    phone: {
        connect: (config: Record<string, unknown>) => Promise<any>;
        disconnect: () => Promise<any>;
        getStatus: () => Promise<any>;
        getConversations: () => Promise<any>;
        getMessages: (convId: string) => Promise<any>;
        sendMessage: (to: string, text: string) => Promise<any>;
        sendLink: (url: string) => Promise<any>;
        sendNote: (content: string, title?: string) => Promise<any>;
        syncClipboard: (direction: "toPhone" | "fromPhone") => Promise<any>;
        submit2FA: (code: string) => void;
        getConfig: () => Promise<any>;
        autoReconnect: () => Promise<any>;
        startClipboardSync: () => void;
        stopClipboardSync: () => void;
        onStatusChange: (cb: (status: Record<string, unknown>) => void) => () => Electron.IpcRenderer;
        onNewMessage: (cb: (msg: Record<string, unknown>) => void) => () => Electron.IpcRenderer;
        onConversationsUpdated: (cb: (convs: Record<string, unknown>[]) => void) => () => Electron.IpcRenderer;
        onCodeDetected: (cb: (alert: Record<string, unknown>) => void) => () => Electron.IpcRenderer;
        on2FARequired: (cb: () => void) => () => Electron.IpcRenderer;
        onClipboardFromPhone: (cb: (text: string) => void) => () => Electron.IpcRenderer;
    };
    settings: {
        get: (key?: string) => Promise<any>;
        set: (key: string, value: unknown) => Promise<any>;
        reset: () => Promise<any>;
        export: () => Promise<any>;
        import: () => Promise<any>;
    };
    bookmarks: {
        get: (profileId: string) => Promise<any>;
        add: (bookmark: Record<string, unknown>) => Promise<any>;
        delete: (id: string) => Promise<any>;
        isBookmarked: (url: string, profileId: string) => Promise<any>;
        getFolders: (profileId: string) => Promise<any>;
        addFolder: (folder: Record<string, unknown>) => Promise<any>;
        importHTML: (profileId: string) => Promise<any>;
    };
    history: {
        get: (profileId: string, limit?: number, offset?: number) => Promise<any>;
        search: (profileId: string, query: string) => Promise<any>;
        clear: (profileId: string, before?: number) => Promise<any>;
        delete: (id: string) => Promise<any>;
    };
    downloads: {
        get: () => Promise<any>;
        open: (savePath: string) => Promise<any>;
        openFolder: (savePath: string) => Promise<any>;
        onItem: (cb: (download: Record<string, unknown>) => void) => () => Electron.IpcRenderer;
    };
    notes: {
        get: (url: string, profileId: string) => Promise<any>;
        save: (note: Record<string, unknown>) => Promise<any>;
        delete: (id: string) => Promise<any>;
    };
    find: {
        search: (tabId: string, query: string, opts?: Record<string, unknown>) => Promise<any>;
        stop: (tabId: string) => Promise<any>;
        onResult: (cb: (result: Record<string, unknown>) => void) => () => Electron.IpcRenderer;
    };
    devtools: {
        open: (tabId: string) => Promise<any>;
    };
    screenshot: {
        capture: (tabId: string, type?: "visible" | "full") => Promise<any>;
    };
    zoom: {
        set: (tabId: string, level: number) => Promise<any>;
        get: (tabId: string) => Promise<any>;
    };
    clipboard: {
        write: (text: string) => Promise<any>;
        read: () => Promise<any>;
    };
    session: {
        save: (tabs: unknown[], profileId: string) => Promise<any>;
        restore: (profileId: string) => Promise<any>;
        popClosedTab: (profileId: string) => Promise<any>;
    };
    window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        isMaximized: () => Promise<any>;
        onMaximized: (cb: (isMax: boolean) => void) => () => Electron.IpcRenderer;
        onResize: (cb: (size: [number, number]) => void) => () => Electron.IpcRenderer;
        setViewBounds: (bounds: {
            x: number;
            y: number;
            width: number;
            height: number;
        }) => void;
    };
    app: {
        getVersion: () => Promise<any>;
        openExternal: (url: string) => Promise<any>;
        openPath: (p: string) => Promise<any>;
        getDefaultDownloadPath: () => Promise<any>;
        onBeforeClose: (cb: () => void) => () => Electron.IpcRenderer;
        onSaveSession: (cb: () => void) => () => Electron.IpcRenderer;
        onOpenNewTab: (cb: (url: string) => void) => () => Electron.IpcRenderer;
        onShortcut: (action: string, cb: () => void) => () => Electron.IpcRenderer;
    };
    filters: {
        get: () => Promise<any>;
        save: (filter: Record<string, unknown>) => Promise<any>;
    };
};
export type FXRKApi = typeof api;
export {};
