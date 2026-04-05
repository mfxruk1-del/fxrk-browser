"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = exports.DEFAULT_SPEED_DIAL = exports.DEFAULT_SHORTCUTS = exports.UA_PRESETS = exports.TRACKER_DOMAINS = exports.ICLOUD_URLS = exports.CLIPBOARD_SYNC_INTERVAL = exports.PHONE_POLL_INTERVAL = exports.FILTER_UPDATE_INTERVAL = exports.AUTO_LOCK_TIMEOUT = exports.SESSION_SAVE_INTERVAL = exports.ENCRYPTION_KEY_SIZE = exports.ENCRYPTION_KEY_ITERATIONS = exports.SETTINGS_URL = exports.NEW_TAB_URL = exports.DEFAULT_HOME_PAGE = exports.SEARCH_ENGINES = exports.FILTER_LIST_URLS = exports.SCREENSHOTS_PATH = exports.SESSIONS_PATH = exports.FILTER_LISTS_PATH = exports.BACKUP_PATH = exports.DOWNLOADS_PATH = exports.LOG_PATH = exports.DB_PATH = exports.USER_DATA_PATH = exports.APP_ID = exports.APP_NAME = exports.APP_VERSION = void 0;
const path = __importStar(require("path"));
const electron_1 = require("electron");
exports.APP_VERSION = '1.0.0';
exports.APP_NAME = 'FXRK Browser';
exports.APP_ID = 'com.fxrk.browser';
// User data paths
exports.USER_DATA_PATH = electron_1.app?.getPath('userData') || path.join(process.env.APPDATA || '', 'fxrk-browser');
exports.DB_PATH = path.join(exports.USER_DATA_PATH, 'fxrk.db');
exports.LOG_PATH = path.join(exports.USER_DATA_PATH, 'logs');
exports.DOWNLOADS_PATH = electron_1.app?.getPath('downloads') || path.join(process.env.USERPROFILE || '', 'Downloads');
exports.BACKUP_PATH = path.join(exports.USER_DATA_PATH, 'backups');
exports.FILTER_LISTS_PATH = path.join(exports.USER_DATA_PATH, 'filter-lists');
exports.SESSIONS_PATH = path.join(exports.USER_DATA_PATH, 'sessions');
exports.SCREENSHOTS_PATH = path.join(exports.USER_DATA_PATH, 'screenshots');
// Filter list URLs (fetched and cached locally)
exports.FILTER_LIST_URLS = {
    easylist: 'https://easylist.to/easylist/easylist.txt',
    easyprivacy: 'https://easylist.to/easylist/easyprivacy.txt',
    fanboy_annoyance: 'https://secure.fanboy.co.nz/fanboy-annoyance.txt',
    ublock_filters: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
    malware_domains: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts',
};
// Default search engine templates
exports.SEARCH_ENGINES = {
    duckduckgo: 'https://duckduckgo.com/?q=%s',
    google: 'https://www.google.com/search?q=%s',
    bing: 'https://www.bing.com/search?q=%s',
    brave: 'https://search.brave.com/search?q=%s',
    ecosia: 'https://www.ecosia.org/search?q=%s',
    startpage: 'https://www.startpage.com/search?q=%s',
};
// Default home page URL
exports.DEFAULT_HOME_PAGE = 'fxrk://newtab';
exports.NEW_TAB_URL = 'fxrk://newtab';
exports.SETTINGS_URL = 'fxrk://settings';
// Encryption
exports.ENCRYPTION_KEY_ITERATIONS = 10000;
exports.ENCRYPTION_KEY_SIZE = 256;
// Session auto-save interval (5 minutes)
exports.SESSION_SAVE_INTERVAL = 5 * 60 * 1000;
// Auto-lock database after 15 minutes
exports.AUTO_LOCK_TIMEOUT = 15 * 60 * 1000;
// Filter list update interval (7 days)
exports.FILTER_UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000;
// Phone bridge poll interval (fallback, 30 seconds)
exports.PHONE_POLL_INTERVAL = 30 * 1000;
// Clipboard sync check interval (60 seconds)
exports.CLIPBOARD_SYNC_INTERVAL = 60 * 1000;
// iCloud URLs
exports.ICLOUD_URLS = {
    login: 'https://www.icloud.com',
    messages: 'https://www.icloud.com/messages',
    notes: 'https://www.icloud.com/notes',
    reminders: 'https://www.icloud.com/reminders',
};
// Known tracker domains (subset — full list loaded from filter lists)
exports.TRACKER_DOMAINS = [
    'google-analytics.com',
    'googletagmanager.com',
    'googletagservices.com',
    'doubleclick.net',
    'googlesyndication.com',
    'facebook.net',
    'facebook.com/tr',
    'connect.facebook.net',
    'hotjar.com',
    'mixpanel.com',
    'amplitude.com',
    'segment.com',
    'fullstory.com',
    'mouseflow.com',
    'smartlook.com',
    'clarity.ms',
    'quantserve.com',
    'scorecardresearch.com',
    'krxd.net',
    'adnxs.com',
    'pubmatic.com',
    'rubiconproject.com',
    'openx.net',
    'criteo.com',
    'outbrain.com',
    'taboola.com',
    'sharethis.com',
    'addthis.com',
    'disqus.com',
    'statcounter.com',
    'chartbeat.com',
    'newrelic.com',
    'sentry.io',
    'bugsnag.com',
    'rollbar.com',
    'logrocket.com',
];
// User-agent presets
exports.UA_PRESETS = [
    {
        id: 'chrome-win',
        name: 'Chrome 120 (Windows)',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        platform: 'Win32',
        isMobile: false,
    },
    {
        id: 'chrome-mac',
        name: 'Chrome 120 (macOS)',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        platform: 'MacIntel',
        isMobile: false,
    },
    {
        id: 'chrome-linux',
        name: 'Chrome 120 (Linux)',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        platform: 'Linux x86_64',
        isMobile: false,
    },
    {
        id: 'firefox-win',
        name: 'Firefox 121 (Windows)',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        platform: 'Win32',
        isMobile: false,
    },
    {
        id: 'firefox-mac',
        name: 'Firefox 121 (macOS)',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:121.0) Gecko/20100101 Firefox/121.0',
        platform: 'MacIntel',
        isMobile: false,
    },
    {
        id: 'firefox-linux',
        name: 'Firefox 121 (Linux)',
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
        platform: 'Linux x86_64',
        isMobile: false,
    },
    {
        id: 'safari-mac',
        name: 'Safari 17 (macOS)',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        platform: 'MacIntel',
        isMobile: false,
    },
    {
        id: 'safari-iphone',
        name: 'Safari (iPhone iOS 17)',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
        platform: 'iPhone',
        isMobile: true,
    },
    {
        id: 'chrome-android',
        name: 'Chrome (Android)',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
        platform: 'Linux armv8l',
        isMobile: true,
    },
    {
        id: 'edge-win',
        name: 'Microsoft Edge (Windows)',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        platform: 'Win32',
        isMobile: false,
    },
    {
        id: 'googlebot',
        name: 'Googlebot Crawler',
        userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        platform: 'Linux',
        isMobile: false,
    },
];
// Default keyboard shortcuts
exports.DEFAULT_SHORTCUTS = [
    { id: 'new-tab', action: 'New Tab', description: 'Open a new tab', keys: ['Ctrl+T'] },
    { id: 'close-tab', action: 'Close Tab', description: 'Close current tab', keys: ['Ctrl+W'] },
    { id: 'reopen-tab', action: 'Reopen Tab', description: 'Reopen last closed tab', keys: ['Ctrl+Shift+T'] },
    { id: 'next-tab', action: 'Next Tab', description: 'Switch to next tab', keys: ['Ctrl+Tab'] },
    { id: 'prev-tab', action: 'Previous Tab', description: 'Switch to previous tab', keys: ['Ctrl+Shift+Tab'] },
    { id: 'navigate-back', action: 'Back', description: 'Go back', keys: ['Alt+Left'] },
    { id: 'navigate-forward', action: 'Forward', description: 'Go forward', keys: ['Alt+Right'] },
    { id: 'refresh', action: 'Refresh', description: 'Reload page', keys: ['Ctrl+R', 'F5'] },
    { id: 'hard-refresh', action: 'Hard Refresh', description: 'Reload ignoring cache', keys: ['Ctrl+Shift+R'] },
    { id: 'address-bar', action: 'Focus URL Bar', description: 'Focus the address bar', keys: ['Ctrl+L', 'F6'] },
    { id: 'find', action: 'Find', description: 'Find in page', keys: ['Ctrl+F'] },
    { id: 'zoom-in', action: 'Zoom In', description: 'Increase zoom', keys: ['Ctrl+='] },
    { id: 'zoom-out', action: 'Zoom Out', description: 'Decrease zoom', keys: ['Ctrl+-'] },
    { id: 'zoom-reset', action: 'Reset Zoom', description: 'Reset zoom to 100%', keys: ['Ctrl+0'] },
    { id: 'fullscreen', action: 'Fullscreen', description: 'Toggle fullscreen', keys: ['F11'] },
    { id: 'devtools', action: 'DevTools', description: 'Open developer tools', keys: ['F12', 'Ctrl+Shift+I'] },
    { id: 'bookmarks', action: 'Bookmarks', description: 'Toggle bookmarks panel', keys: ['Ctrl+B'] },
    { id: 'history', action: 'History', description: 'Toggle history panel', keys: ['Ctrl+H'] },
    { id: 'downloads', action: 'Downloads', description: 'Toggle downloads panel', keys: ['Ctrl+J'] },
    { id: 'settings', action: 'Settings', description: 'Open settings', keys: ['Ctrl+,'] },
    { id: 'bookmark-page', action: 'Bookmark Page', description: 'Bookmark current page', keys: ['Ctrl+D'] },
    { id: 'screenshot', action: 'Screenshot', description: 'Capture screenshot', keys: ['Ctrl+Shift+S'] },
    { id: 'reading-mode', action: 'Reading Mode', description: 'Toggle reading mode', keys: ['Ctrl+Shift+R'] },
    { id: 'split-screen', action: 'Split Screen', description: 'Toggle split screen', keys: ['Ctrl+Shift+\\'] },
    { id: 'sidebar', action: 'Toggle Sidebar', description: 'Show/hide sidebar', keys: ['Ctrl+Shift+B'] },
    { id: 'phone-panel', action: 'Phone Panel', description: 'Toggle phone integration panel', keys: ['Ctrl+Shift+P'] },
];
// Speed dial default sites for new tab page
exports.DEFAULT_SPEED_DIAL = [
    { id: '1', title: 'DuckDuckGo', url: 'https://duckduckgo.com', favicon: '' },
    { id: '2', title: 'GitHub', url: 'https://github.com', favicon: '' },
    { id: '3', title: 'YouTube', url: 'https://youtube.com', favicon: '' },
    { id: '4', title: 'Reddit', url: 'https://reddit.com', favicon: '' },
    { id: '5', title: 'Hacker News', url: 'https://news.ycombinator.com', favicon: '' },
    { id: '6', title: 'Wikipedia', url: 'https://wikipedia.org', favicon: '' },
    { id: '7', title: 'Twitter/X', url: 'https://x.com', favicon: '' },
    { id: '8', title: 'ChatGPT', url: 'https://chatgpt.com', favicon: '' },
];
// Re-export IPC_CHANNELS from types for convenience
var types_1 = require("./types");
Object.defineProperty(exports, "IPC_CHANNELS", { enumerable: true, get: function () { return types_1.IPC_CHANNELS; } });
//# sourceMappingURL=constants.js.map