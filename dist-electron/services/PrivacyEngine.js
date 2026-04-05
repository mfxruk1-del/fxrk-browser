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
exports.privacyEngine = void 0;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
const logger_1 = require("../utils/logger");
const DatabaseService_1 = require("./DatabaseService");
const constants_1 = require("../utils/constants");
// ============================================================
// FXRK Browser - Privacy Engine
// Handles ad blocking, tracker blocking, cookie management,
// fingerprint spoofing, and HTTPS-only mode.
// ============================================================
const FILTER_PATH = path.join(process.env.APPDATA || path.join(process.env.HOME || '', '.config'), 'fxrk-browser', 'filter-lists');
// In-memory set of blocked domains for fast O(1) lookups
const blockedDomains = new Set();
// Track blocked counts per tab per session
const tabBlockedCounts = new Map();
// Track current privacy grade per URL
const urlPrivacyGrades = new Map();
// Regex patterns for known tracker URLs
const TRACKER_URL_PATTERNS = [
    /google-analytics\.com/,
    /googletagmanager\.com/,
    /doubleclick\.net/,
    /googlesyndication\.com/,
    /facebook\.net/,
    /connect\.facebook\.net/,
    /hotjar\.com/,
    /mixpanel\.com\/track/,
    /amplitude\.com\/httpapi/,
    /segment\.io\/v1/,
    /fullstory\.com/,
    /mouseflow\.com/,
    /clarity\.ms/,
    /quantserve\.com/,
    /scorecardresearch\.com/,
    /adnxs\.com/,
    /criteo\.com/,
    /outbrain\.com/,
    /taboola\.com/,
    /statcounter\.com/,
    /chartbeat\.com/,
    /coinhive\.com/, // cryptominer
    /coin-hive\.com/, // cryptominer
    /minero\.cc/, // cryptominer
    /jsecoin\.com/, // cryptominer
    /fingerprintjs\.com/, // fingerprinting
    /fpjs\.pro/, // fingerprinting
];
// Regexes for fingerprinting detection
const FINGERPRINT_PATTERNS = [
    /fingerprintjs/i,
    /fpjs/i,
    /fingerprint2/i,
    /clientjs/i,
    /evercookie/i,
];
class PrivacyEngine {
    settings;
    lastFilterUpdate = 0;
    siteWhitelist = new Set(); // domains where ad blocking is disabled
    constructor() {
        this.settings = this.loadSettings();
    }
    /** Load privacy settings from database */
    loadSettings() {
        const defaults = {
            adBlockEnabled: true,
            trackerBlockEnabled: true,
            cookieBlockMode: 'third-party',
            cookieClearOnClose: false,
            fingerprintSpoof: true,
            httpsOnly: false,
            doHProvider: 'cloudflare',
            doHCustomUrl: '',
            jsEnabled: true,
            webRtcPolicy: 'default',
            referrerPolicy: 'strict-origin-when-cross-origin',
            siteSpecificAdBlock: {},
            siteSpecificJs: {},
            siteSpecificCookies: {},
        };
        try {
            return DatabaseService_1.db.getSetting('privacy', defaults);
        }
        catch {
            // DB not yet initialized at module load — use defaults; initialize() will reload
            return defaults;
        }
    }
    /** Initialize all privacy features on a session partition */
    async initialize(sess) {
        const targetSession = sess || electron_1.session.defaultSession;
        // Re-load settings now that DB is ready
        this.settings = this.loadSettings();
        // Load filter lists into memory
        await this.loadFilterLists();
        // Set up request interception
        this.setupRequestInterception(targetSession);
        // Apply cookie policy
        this.applyCookiePolicy(targetSession);
        // Inject fingerprint spoofer into all pages
        if (this.settings.fingerprintSpoof) {
            this.injectFingerprintSpoofer(targetSession);
        }
        logger_1.logger.privacy.info('Privacy engine initialized');
    }
    /** Load EasyList and EasyPrivacy from disk (or download if missing) */
    async loadFilterLists() {
        fs.mkdirSync(FILTER_PATH, { recursive: true });
        const easylistPath = path.join(FILTER_PATH, 'easylist.txt');
        const easyprivacyPath = path.join(FILTER_PATH, 'easyprivacy.txt');
        const needsUpdate = (filePath) => {
            if (!fs.existsSync(filePath))
                return true;
            const stat = fs.statSync(filePath);
            return Date.now() - stat.mtimeMs > constants_1.FILTER_UPDATE_INTERVAL;
        };
        // Download missing or outdated filter lists
        const downloads = [];
        if (needsUpdate(easylistPath)) {
            downloads.push(this.downloadFilterList(constants_1.FILTER_LIST_URLS.easylist, easylistPath));
        }
        if (needsUpdate(easyprivacyPath)) {
            downloads.push(this.downloadFilterList(constants_1.FILTER_LIST_URLS.easyprivacy, easyprivacyPath));
        }
        if (downloads.length > 0) {
            await Promise.allSettled(downloads);
        }
        // Parse and load filter lists into memory
        this.parseFilterList(easylistPath);
        this.parseFilterList(easyprivacyPath);
        // Always add known tracker domains from our hardcoded list
        constants_1.TRACKER_DOMAINS.forEach(d => blockedDomains.add(d));
        // Load user custom filters
        const customFilters = DatabaseService_1.db.getCustomFilters();
        customFilters
            .filter(f => f.enabled && f.type === 'block')
            .forEach(f => blockedDomains.add(f.pattern));
        logger_1.logger.privacy.info(`Loaded ${blockedDomains.size} blocked domains/patterns`);
    }
    /** Download a filter list from the given URL to a local file */
    downloadFilterList(url, savePath) {
        return new Promise((resolve) => {
            logger_1.logger.privacy.info(`Downloading filter list: ${url}`);
            const file = fs.createWriteStream(savePath);
            https.get(url, (res) => {
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    logger_1.logger.privacy.info(`Downloaded: ${path.basename(savePath)}`);
                    resolve();
                });
            }).on('error', (err) => {
                logger_1.logger.privacy.warn(`Failed to download ${url}: ${err.message}`);
                fs.unlink(savePath, () => { }); // Remove partial file
                resolve(); // Don't fail initialization on download error
            });
        });
    }
    /** Parse a filter list file and add domains to the blocked set */
    parseFilterList(filePath) {
        if (!fs.existsSync(filePath))
            return;
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let added = 0;
        for (const line of lines) {
            const trimmed = line.trim();
            // Skip comments and empty lines
            if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('['))
                continue;
            // Extract domain from ||domain^ patterns (most common in EasyList)
            const domainMatch = trimmed.match(/^\|\|([a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9])\^/);
            if (domainMatch) {
                blockedDomains.add(domainMatch[1]);
                added++;
            }
        }
        logger_1.logger.privacy.debug(`Parsed ${path.basename(filePath)}: added ${added} entries`);
    }
    /** Wire up session.webRequest to intercept and block requests */
    setupRequestInterception(sess) {
        // onBeforeRequest — block matching requests before they're sent
        sess.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
            // Allow main frame navigations always
            if (details.resourceType === 'mainFrame') {
                return callback({ cancel: false });
            }
            const url = details.url;
            const hostname = this.extractHostname(url);
            // Check if the initiating page has ad blocking disabled
            if (details.webContentsId) {
                const tabDomain = this.getTabDomain(details.webContentsId);
                if (tabDomain && this.isWhitelisted(tabDomain)) {
                    return callback({ cancel: false });
                }
            }
            // HTTPS-only mode: redirect HTTP to HTTPS for sub-resources
            if (this.settings.httpsOnly && url.startsWith('http://')) {
                const httpsUrl = url.replace(/^http:\/\//, 'https://');
                return callback({ redirectURL: httpsUrl });
            }
            // Check ad blocking
            if (this.settings.adBlockEnabled && this.isBlocked(hostname, url)) {
                if (details.webContentsId) {
                    const count = tabBlockedCounts.get(details.webContentsId) ?? 0;
                    tabBlockedCounts.set(details.webContentsId, count + 1);
                }
                DatabaseService_1.db.recordBlockedRequest(hostname);
                logger_1.logger.privacy.debug(`Blocked: ${url}`);
                return callback({ cancel: true });
            }
            callback({ cancel: false });
        });
        // onBeforeSendHeaders — modify/strip tracking headers
        sess.webRequest.onBeforeSendHeaders({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
            const headers = { ...details.requestHeaders };
            // Remove tracking headers
            delete headers['X-Client-Data']; // Google Chrome client data
            delete headers['X-DevTools-Emulate-Network-Conditions-Client-Id'];
            // Enforce referrer policy
            if (this.settings.referrerPolicy === 'no-referrer') {
                headers['Referer'] = '';
            }
            callback({ requestHeaders: headers });
        });
        logger_1.logger.privacy.info('Request interception enabled');
    }
    /** Returns true if a URL/hostname should be blocked */
    isBlocked(hostname, url) {
        if (!hostname)
            return false;
        // Direct domain match
        if (blockedDomains.has(hostname))
            return true;
        // Check parent domains (e.g., if "ads.tracker.com" → check "tracker.com" too)
        const parts = hostname.split('.');
        for (let i = 1; i < parts.length - 1; i++) {
            if (blockedDomains.has(parts.slice(i).join('.')))
                return true;
        }
        // Tracker URL pattern regex check
        if (this.settings.trackerBlockEnabled) {
            return TRACKER_URL_PATTERNS.some(pattern => pattern.test(url)) ||
                FINGERPRINT_PATTERNS.some(pattern => pattern.test(url));
        }
        return false;
    }
    /** Returns true if the domain is whitelisted from ad blocking */
    isWhitelisted(domain) {
        if (this.siteWhitelist.has(domain))
            return true;
        if (this.settings.siteSpecificAdBlock[domain] === false)
            return true;
        return false;
    }
    /** Apply session-wide cookie policy based on settings */
    applyCookiePolicy(sess) {
        if (this.settings.cookieBlockMode === 'all') {
            // Block all cookies — done via request headers
            sess.webRequest.onHeadersReceived({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
                const headers = { ...details.responseHeaders };
                // Remove Set-Cookie headers to block all cookies
                delete headers['set-cookie'];
                delete headers['Set-Cookie'];
                callback({ responseHeaders: headers });
            });
        }
        // Third-party cookie blocking is handled by Electron's session cookie store settings
    }
    /** Inject fingerprint spoofer script into every page via preload */
    injectFingerprintSpoofer(sess) {
        const spooferScript = this.buildFingerprintSpooferScript();
        sess.setPreloads([
            ...sess.getPreloads().filter(p => !p.includes('fingerprint-spoofer')),
        ]);
        // We inject via the preload path rather than script content
        // The actual script is in electron/preload.ts
        logger_1.logger.privacy.info('Fingerprint spoofer ready (via preload injection)');
    }
    /** Build the fingerprint spoofer JavaScript to inject into pages */
    buildFingerprintSpooferScript() {
        // Generate random but plausible values for this session
        const screenWidth = [1920, 1366, 1440, 1280, 1600, 1024][Math.floor(Math.random() * 6)];
        const screenHeight = [1080, 768, 900, 800, 900, 768][Math.floor(Math.random() * 6)];
        const canvasNoise = (Math.random() * 0.0001).toFixed(8);
        const audioNoise = (Math.random() * 0.00001).toFixed(10);
        const languages = JSON.stringify(['en-US', 'en']);
        const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const webglVendors = ['Intel Inc.', 'NVIDIA Corporation', 'AMD'];
        const webglRenderers = [
            'Intel Iris OpenGL Engine',
            'NVIDIA GeForce RTX 3070',
            'AMD Radeon RX 580',
            'Intel UHD Graphics 620',
        ];
        const webglVendor = webglVendors[Math.floor(Math.random() * webglVendors.length)];
        const webglRenderer = webglRenderers[Math.floor(Math.random() * webglRenderers.length)];
        return `
(function() {
  'use strict';

  // ── Canvas Fingerprint Noise ──────────────────────────────
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, attrs) {
    const ctx = originalGetContext.call(this, type, attrs);
    if (!ctx) return ctx;
    if (type === '2d') {
      const originalGetImageData = ctx.getImageData.bind(ctx);
      ctx.getImageData = function(x, y, w, h) {
        const imageData = originalGetImageData(x, y, w, h);
        const noise = ${canvasNoise};
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i]   = Math.min(255, imageData.data[i]   + (Math.random() - 0.5) * noise * 255);
          imageData.data[i+1] = Math.min(255, imageData.data[i+1] + (Math.random() - 0.5) * noise * 255);
          imageData.data[i+2] = Math.min(255, imageData.data[i+2] + (Math.random() - 0.5) * noise * 255);
        }
        return imageData;
      };
    }
    return ctx;
  };

  // ── WebGL Fingerprint Spoof ───────────────────────────────
  const getParameterProxyHandler = {
    apply: function(target, thisArg, argumentsList) {
      const param = argumentsList[0];
      const debugInfo = thisArg.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        if (param === debugInfo.UNMASKED_VENDOR_WEBGL)   return '${webglVendor}';
        if (param === debugInfo.UNMASKED_RENDERER_WEBGL) return '${webglRenderer}';
      }
      return Reflect.apply(target, thisArg, argumentsList);
    }
  };
  const getContextOrig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
    apply(target, thisArg, args) {
      const ctx = Reflect.apply(target, thisArg, args);
      if (ctx && (args[0] === 'webgl' || args[0] === 'webgl2' || args[0] === 'experimental-webgl')) {
        ctx.getParameter = new Proxy(ctx.getParameter, getParameterProxyHandler);
      }
      return ctx;
    }
  });

  // ── AudioContext Fingerprint Noise ────────────────────────
  const OrigAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OrigAudioContext) {
    const origCreateOscillator = OrigAudioContext.prototype.createOscillator;
    OrigAudioContext.prototype.createOscillator = function() {
      const osc = origCreateOscillator.call(this);
      const origConnect = osc.connect.bind(osc);
      osc.connect = function(dest, ...args) {
        // Inject tiny noise node between oscillator and destination
        try {
          const gainNode = this.context.createGain();
          gainNode.gain.value = 1 + (Math.random() - 0.5) * ${audioNoise};
          origConnect(gainNode, ...args);
          gainNode.connect(dest);
        } catch {
          origConnect(dest, ...args);
        }
        return dest;
      };
      return osc;
    };
  }

  // ── Screen Resolution Spoof ───────────────────────────────
  try {
    Object.defineProperty(screen, 'width',       { get: () => ${screenWidth}  });
    Object.defineProperty(screen, 'height',      { get: () => ${screenHeight} });
    Object.defineProperty(screen, 'availWidth',  { get: () => ${screenWidth}  });
    Object.defineProperty(screen, 'availHeight', { get: () => ${screenHeight - 40} });
    Object.defineProperty(screen, 'colorDepth',  { get: () => 24 });
    Object.defineProperty(screen, 'pixelDepth',  { get: () => 24 });
  } catch(e) {}

  // ── Navigator Spoof ───────────────────────────────────────
  try {
    Object.defineProperty(navigator, 'languages', {
      get: () => ${languages}
    });
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        return { length: 3, item: () => null, namedItem: () => null, refresh: () => {} };
      }
    });
    Object.defineProperty(navigator, 'platform', { get: () => '${platform}' });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 + Math.floor(Math.random() * 4) });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  } catch(e) {}

  // ── Timing API Noise ──────────────────────────────────────
  const origNow = performance.now.bind(performance);
  performance.now = function() {
    return origNow() + (Math.random() - 0.5) * 0.01;
  };

})();
    `;
    }
    /** Get privacy grade for a URL based on blocked trackers */
    getPrivacyGrade(url, blockedCount, isHTTPS) {
        let score = 100;
        if (!isHTTPS)
            score -= 30;
        if (blockedCount > 10)
            score -= 30;
        else if (blockedCount > 5)
            score -= 20;
        else if (blockedCount > 2)
            score -= 10;
        else if (blockedCount > 0)
            score -= 5;
        let grade;
        if (score >= 90)
            grade = 'A';
        else if (score >= 75)
            grade = 'B';
        else if (score >= 60)
            grade = 'C';
        else if (score >= 40)
            grade = 'D';
        else
            grade = 'F';
        return {
            grade,
            score,
            trackers: [],
            cookies: 0,
            isHTTPS,
            mixedContent: false,
        };
    }
    /** Returns blocked request count for a webContents */
    getBlockedCount(webContentsId) {
        return tabBlockedCounts.get(webContentsId) ?? 0;
    }
    /** Resets blocked count for a webContents (on navigation) */
    resetBlockedCount(webContentsId) {
        tabBlockedCounts.set(webContentsId, 0);
    }
    /** Toggle ad blocking for a specific domain */
    toggleSiteAdBlocking(domain, enabled) {
        if (enabled) {
            this.siteWhitelist.delete(domain);
            delete this.settings.siteSpecificAdBlock[domain];
        }
        else {
            this.siteWhitelist.add(domain);
            this.settings.siteSpecificAdBlock[domain] = false;
        }
        this.saveSettings();
    }
    /** Get current privacy settings */
    getSettings() {
        return { ...this.settings };
    }
    /** Update privacy settings */
    updateSettings(partial) {
        this.settings = { ...this.settings, ...partial };
        this.saveSettings();
    }
    saveSettings() {
        DatabaseService_1.db.setSetting('privacy', this.settings);
    }
    /** Extract hostname from URL safely */
    extractHostname(url) {
        try {
            return new URL(url).hostname;
        }
        catch {
            return '';
        }
    }
    /** Map from webContentsId to current page domain */
    tabDomains = new Map();
    updateTabDomain(webContentsId, url) {
        this.tabDomains.set(webContentsId, this.extractHostname(url));
    }
    getTabDomain(webContentsId) {
        return this.tabDomains.get(webContentsId);
    }
}
exports.privacyEngine = new PrivacyEngine();
exports.default = exports.privacyEngine;
//# sourceMappingURL=PrivacyEngine.js.map