"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uaManager = void 0;
const electron_1 = require("electron");
const logger_1 = require("../utils/logger");
const DatabaseService_1 = require("./DatabaseService");
const constants_1 = require("../utils/constants");
// ============================================================
// FXRK Browser - User Agent Manager
// ============================================================
class UserAgentManager {
    settings;
    presets = constants_1.UA_PRESETS;
    currentSessionUA = '';
    constructor() {
        this.settings = this.loadSettings();
        this.currentSessionUA = this.getActiveUserAgent();
    }
    loadSettings() {
        const defaults = {
            defaultPreset: 'chrome-win',
            customUserAgent: '',
            autoRotate: false,
            siteSpecificRules: {},
        };
        try {
            return DatabaseService_1.db.getSetting('userAgent', defaults);
        }
        catch {
            return defaults;
        }
    }
    /** Re-load settings from DB (called after DB is initialized) */
    reloadSettings() {
        this.settings = this.loadSettings();
        this.currentSessionUA = this.getActiveUserAgent();
    }
    /** Get all built-in UA presets */
    getPresets() {
        return this.presets;
    }
    /** Get the currently active default user agent string */
    getActiveUserAgent() {
        if (this.settings.customUserAgent) {
            return this.settings.customUserAgent;
        }
        const preset = this.presets.find(p => p.id === this.settings.defaultPreset);
        return preset?.userAgent ?? this.presets[0].userAgent;
    }
    /** Get UA for a specific domain (site-specific rules take priority) */
    getUserAgentForDomain(domain) {
        const siteUA = this.settings.siteSpecificRules[domain];
        if (siteUA)
            return siteUA;
        // Auto-rotate: pick a random UA each call
        if (this.settings.autoRotate) {
            const randomPreset = this.presets[Math.floor(Math.random() * this.presets.length)];
            return randomPreset.userAgent;
        }
        return null; // Use global default
    }
    /** Apply the default UA to the Electron session */
    applyToSession(sess) {
        const ua = this.getActiveUserAgent();
        const targetSession = sess || electron_1.session.defaultSession;
        targetSession.setUserAgent(ua);
        this.currentSessionUA = ua;
        logger_1.logger.info(`UA set: ${ua.substring(0, 80)}...`);
    }
    /** Set per-request UA based on site-specific rules */
    applyRequestUA(sess) {
        const targetSession = sess || electron_1.session.defaultSession;
        const uaManager = this;
        targetSession.webRequest.onBeforeSendHeaders({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
            const headers = { ...details.requestHeaders };
            // Determine domain from URL
            try {
                const hostname = new URL(details.url).hostname;
                const siteUA = uaManager.getUserAgentForDomain(hostname);
                if (siteUA) {
                    headers['User-Agent'] = siteUA;
                }
            }
            catch {
                // Ignore URL parse errors
            }
            callback({ requestHeaders: headers });
        });
    }
    /** Update settings and reapply */
    updateSettings(partial) {
        this.settings = { ...this.settings, ...partial };
        DatabaseService_1.db.setSetting('userAgent', this.settings);
        this.applyToSession();
    }
    /** Set a per-site UA rule */
    setSiteRule(domain, uaId) {
        if (uaId === null) {
            delete this.settings.siteSpecificRules[domain];
        }
        else {
            const preset = this.presets.find(p => p.id === uaId);
            this.settings.siteSpecificRules[domain] = preset?.userAgent ?? uaId;
        }
        DatabaseService_1.db.setSetting('userAgent', this.settings);
    }
    getSettings() {
        return { ...this.settings };
    }
    getCurrentUA() {
        return this.currentSessionUA;
    }
}
exports.uaManager = new UserAgentManager();
exports.default = exports.uaManager;
//# sourceMappingURL=UserAgentManager.js.map