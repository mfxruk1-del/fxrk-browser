export interface Tab {
    id: string;
    url: string;
    title: string;
    favicon: string;
    isLoading: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
    isActive: boolean;
    isPinned: boolean;
    isMuted: boolean;
    containerId: string | null;
    profileId: string;
    zoomLevel: number;
    scrollPosition: {
        x: number;
        y: number;
    };
    screenshot?: string;
    errorCode?: number;
    errorDescription?: string;
    webviewId?: number;
}
export interface NavigationEntry {
    url: string;
    title: string;
    timestamp: number;
}
export interface HistoryEntry {
    id: string;
    url: string;
    title: string;
    favicon: string;
    visitedAt: number;
    visitCount: number;
    profileId: string;
}
export interface Bookmark {
    id: string;
    url: string;
    title: string;
    favicon: string;
    folderId: string | null;
    profileId: string;
    createdAt: number;
    tags: string[];
}
export interface BookmarkFolder {
    id: string;
    name: string;
    parentId: string | null;
    profileId: string;
    createdAt: number;
}
export interface Download {
    id: string;
    url: string;
    filename: string;
    savePath: string;
    totalBytes: number;
    receivedBytes: number;
    state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
    paused: boolean;
    startedAt: number;
    completedAt?: number;
    mimeType: string;
    speed?: number;
}
export interface PrivacyGrade {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    score: number;
    trackers: string[];
    cookies: number;
    isHTTPS: boolean;
    mixedContent: boolean;
}
export interface BlockedRequest {
    url: string;
    type: 'ad' | 'tracker' | 'malware' | 'fingerprint' | 'miner';
    domain: string;
    tabId: string;
    timestamp: number;
}
export interface PrivacySettings {
    adBlockEnabled: boolean;
    trackerBlockEnabled: boolean;
    cookieBlockMode: 'all' | 'third-party' | 'none';
    cookieClearOnClose: boolean;
    fingerprintSpoof: boolean;
    httpsOnly: boolean;
    doHProvider: 'cloudflare' | 'google' | 'quad9' | 'custom' | 'system';
    doHCustomUrl: string;
    jsEnabled: boolean;
    webRtcPolicy: 'default' | 'disable_non_proxied_udp' | 'proxy_only' | 'disable';
    referrerPolicy: 'no-referrer' | 'origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
    siteSpecificAdBlock: Record<string, boolean>;
    siteSpecificJs: Record<string, boolean>;
    siteSpecificCookies: Record<string, 'allow' | 'block' | 'session'>;
}
export interface UserAgentPreset {
    id: string;
    name: string;
    userAgent: string;
    platform: string;
    isMobile: boolean;
}
export interface UserAgentSettings {
    defaultPreset: string;
    customUserAgent: string;
    autoRotate: boolean;
    siteSpecificRules: Record<string, string>;
}
export interface Account {
    id: string;
    provider: 'google' | 'microsoft' | 'github' | 'twitter' | 'discord' | 'spotify' | 'reddit' | 'custom';
    email: string;
    displayName: string;
    avatarUrl: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiry: number;
    profileId: string;
    providerConfig?: OAuthProviderConfig;
}
export interface OAuthProviderConfig {
    id: string;
    name: string;
    authorizationUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scopes: string[];
    redirectUri: string;
    iconUrl?: string;
}
export interface Profile {
    id: string;
    name: string;
    avatar: string;
    color: string;
    isLocked: boolean;
    passwordHash?: string;
    createdAt: number;
    partition: string;
}
export interface Credential {
    id: string;
    url: string;
    domain: string;
    username: string;
    password: string;
    notes: string;
    profileId: string;
    createdAt: number;
    updatedAt: number;
    lastUsed?: number;
}
export interface Container {
    id: string;
    name: string;
    color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan' | 'custom';
    customColor?: string;
    icon: string;
    siteRules: string[];
    profileId: string;
}
export interface SMSMessage {
    id: string;
    conversationId: string;
    sender: string;
    senderName?: string;
    text: string;
    timestamp: number;
    isOutgoing: boolean;
    hasVerificationCode: boolean;
    verificationCode?: string;
}
export interface SMSConversation {
    id: string;
    participantNumber: string;
    participantName?: string;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount: number;
    messages: SMSMessage[];
}
export interface PhoneNotification {
    id: string;
    source: string;
    title: string;
    body: string;
    timestamp: number;
    isRead: boolean;
    type: 'sms' | 'reminder' | 'note' | 'clipboard';
}
export interface PhoneBridgeConfig {
    appleId: string;
    appSpecificPassword: string;
    sessionCookies?: string;
    lastConnected?: number;
}
export interface PhoneBridgeStatus {
    connected: boolean;
    authenticating: boolean;
    error?: string;
    lastSync?: number;
}
export interface VerificationCodeAlert {
    id: string;
    code: string;
    sender: string;
    messageText: string;
    detectedAt: number;
    copiedToClipboard: boolean;
    autoFilled: boolean;
}
export interface Note {
    id: string;
    url: string;
    domain: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    profileId: string;
}
export interface SiteZoom {
    domain: string;
    zoom: number;
}
export interface CustomFilter {
    id: string;
    pattern: string;
    type: 'block' | 'allow' | 'redirect';
    enabled: boolean;
    comment: string;
}
export interface AppSettings {
    theme: 'cyberpunk' | 'light' | 'custom';
    customTheme?: Record<string, string>;
    defaultSearchEngine: 'duckduckgo' | 'google' | 'bing' | 'brave' | 'custom';
    customSearchUrl: string;
    homePage: string;
    startupBehavior: 'new-tab' | 'last-session' | 'homepage';
    downloadPath: string;
    askDownloadLocation: boolean;
    defaultZoom: number;
    fontSize: number;
    showScrollbars: boolean;
    hardwareAcceleration: boolean;
    tabBarPosition: 'top' | 'left';
    sidebarPosition: 'left' | 'right';
    showStatusBar: boolean;
    compactMode: boolean;
    language: string;
    spellCheck: boolean;
    autofillEnabled: boolean;
    passwordManagerEnabled: boolean;
    syncEnabled: boolean;
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    sessionRestore: boolean;
    autoSaveSession: boolean;
}
export interface KeyboardShortcut {
    id: string;
    action: string;
    description: string;
    keys: string[];
    isCustom: boolean;
}
export declare const IPC_CHANNELS: {
    readonly TAB_CREATE: "tab:create";
    readonly TAB_CLOSE: "tab:close";
    readonly TAB_SWITCH: "tab:switch";
    readonly TAB_UPDATE: "tab:update";
    readonly TAB_REORDER: "tab:reorder";
    readonly TAB_PIN: "tab:pin";
    readonly TAB_MUTE: "tab:mute";
    readonly TAB_DUPLICATE: "tab:duplicate";
    readonly NAVIGATE: "navigate";
    readonly NAVIGATE_BACK: "navigate:back";
    readonly NAVIGATE_FORWARD: "navigate:forward";
    readonly NAVIGATE_REFRESH: "navigate:refresh";
    readonly NAVIGATE_STOP: "navigate:stop";
    readonly NAVIGATE_HOME: "navigate:home";
    readonly PRIVACY_GET_SETTINGS: "privacy:getSettings";
    readonly PRIVACY_SET_SETTINGS: "privacy:setSettings";
    readonly PRIVACY_GET_GRADE: "privacy:getGrade";
    readonly PRIVACY_GET_BLOCKED_COUNT: "privacy:getBlockedCount";
    readonly PRIVACY_TOGGLE_SITE: "privacy:toggleSite";
    readonly PRIVACY_CLEAR_COOKIES: "privacy:clearCookies";
    readonly PRIVACY_GET_COOKIES: "privacy:getCookies";
    readonly AUTH_GET_ACCOUNTS: "auth:getAccounts";
    readonly AUTH_ADD_ACCOUNT: "auth:addAccount";
    readonly AUTH_REMOVE_ACCOUNT: "auth:removeAccount";
    readonly AUTH_GET_PROFILES: "auth:getProfiles";
    readonly AUTH_SWITCH_PROFILE: "auth:switchProfile";
    readonly AUTH_CREATE_PROFILE: "auth:createProfile";
    readonly AUTH_GET_CREDENTIALS: "auth:getCredentials";
    readonly AUTH_SAVE_CREDENTIAL: "auth:saveCredential";
    readonly AUTH_DELETE_CREDENTIAL: "auth:deleteCredential";
    readonly PHONE_CONNECT: "phone:connect";
    readonly PHONE_DISCONNECT: "phone:disconnect";
    readonly PHONE_GET_STATUS: "phone:getStatus";
    readonly PHONE_GET_CONVERSATIONS: "phone:getConversations";
    readonly PHONE_GET_MESSAGES: "phone:getMessages";
    readonly PHONE_SEND_MESSAGE: "phone:sendMessage";
    readonly PHONE_SEND_LINK: "phone:sendLink";
    readonly PHONE_SEND_NOTE: "phone:sendNote";
    readonly PHONE_CODE_DETECTED: "phone:codeDetected";
    readonly PHONE_SYNC_CLIPBOARD: "phone:syncClipboard";
    readonly SETTINGS_GET: "settings:get";
    readonly SETTINGS_SET: "settings:set";
    readonly SETTINGS_RESET: "settings:reset";
    readonly SETTINGS_EXPORT: "settings:export";
    readonly SETTINGS_IMPORT: "settings:import";
    readonly WINDOW_MINIMIZE: "window:minimize";
    readonly WINDOW_MAXIMIZE: "window:maximize";
    readonly WINDOW_CLOSE: "window:close";
    readonly WINDOW_IS_MAXIMIZED: "window:isMaximized";
    readonly FIND_IN_PAGE: "find:inPage";
    readonly FIND_STOP: "find:stop";
    readonly DEVTOOLS_OPEN: "devtools:open";
    readonly SCREENSHOT_CAPTURE: "screenshot:capture";
    readonly DOWNLOAD_ITEM: "download:item";
    readonly DOWNLOAD_PAUSE: "download:pause";
    readonly DOWNLOAD_RESUME: "download:resume";
    readonly DOWNLOAD_CANCEL: "download:cancel";
};
