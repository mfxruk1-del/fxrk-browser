export declare const APP_VERSION = "1.0.0";
export declare const APP_NAME = "FXRK Browser";
export declare const APP_ID = "com.fxrk.browser";
export declare const USER_DATA_PATH: string;
export declare const DB_PATH: string;
export declare const LOG_PATH: string;
export declare const DOWNLOADS_PATH: string;
export declare const BACKUP_PATH: string;
export declare const FILTER_LISTS_PATH: string;
export declare const SESSIONS_PATH: string;
export declare const SCREENSHOTS_PATH: string;
export declare const FILTER_LIST_URLS: {
    easylist: string;
    easyprivacy: string;
    fanboy_annoyance: string;
    ublock_filters: string;
    malware_domains: string;
};
export declare const SEARCH_ENGINES: {
    readonly duckduckgo: "https://duckduckgo.com/?q=%s";
    readonly google: "https://www.google.com/search?q=%s";
    readonly bing: "https://www.bing.com/search?q=%s";
    readonly brave: "https://search.brave.com/search?q=%s";
    readonly ecosia: "https://www.ecosia.org/search?q=%s";
    readonly startpage: "https://www.startpage.com/search?q=%s";
};
export declare const DEFAULT_HOME_PAGE = "fxrk://newtab";
export declare const NEW_TAB_URL = "fxrk://newtab";
export declare const SETTINGS_URL = "fxrk://settings";
export declare const ENCRYPTION_KEY_ITERATIONS = 10000;
export declare const ENCRYPTION_KEY_SIZE = 256;
export declare const SESSION_SAVE_INTERVAL: number;
export declare const AUTO_LOCK_TIMEOUT: number;
export declare const FILTER_UPDATE_INTERVAL: number;
export declare const PHONE_POLL_INTERVAL: number;
export declare const CLIPBOARD_SYNC_INTERVAL: number;
export declare const ICLOUD_URLS: {
    login: string;
    messages: string;
    notes: string;
    reminders: string;
};
export declare const TRACKER_DOMAINS: string[];
export declare const UA_PRESETS: {
    id: string;
    name: string;
    userAgent: string;
    platform: string;
    isMobile: boolean;
}[];
export declare const DEFAULT_SHORTCUTS: {
    id: string;
    action: string;
    description: string;
    keys: string[];
}[];
export declare const DEFAULT_SPEED_DIAL: {
    id: string;
    title: string;
    url: string;
    favicon: string;
}[];
export { IPC_CHANNELS } from './types';
