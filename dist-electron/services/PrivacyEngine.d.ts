import type { PrivacySettings, PrivacyGrade } from '../utils/types';
declare class PrivacyEngine {
    private settings;
    private lastFilterUpdate;
    private siteWhitelist;
    constructor();
    /** Load privacy settings from database */
    private loadSettings;
    /** Initialize all privacy features on a session partition */
    initialize(sess?: Electron.Session): Promise<void>;
    /** Load EasyList and EasyPrivacy from disk (or download if missing) */
    loadFilterLists(): Promise<void>;
    /** Download a filter list from the given URL to a local file */
    private downloadFilterList;
    /** Parse a filter list file and add domains to the blocked set */
    private parseFilterList;
    /** Wire up session.webRequest to intercept and block requests */
    private setupRequestInterception;
    /** Returns true if a URL/hostname should be blocked */
    private isBlocked;
    /** Returns true if the domain is whitelisted from ad blocking */
    private isWhitelisted;
    /** Apply session-wide cookie policy based on settings */
    private applyCookiePolicy;
    /** Inject fingerprint spoofer script into every page via preload */
    private injectFingerprintSpoofer;
    /** Build the fingerprint spoofer JavaScript to inject into pages */
    buildFingerprintSpooferScript(): string;
    /** Get privacy grade for a URL based on blocked trackers */
    getPrivacyGrade(url: string, blockedCount: number, isHTTPS: boolean): PrivacyGrade;
    /** Returns blocked request count for a webContents */
    getBlockedCount(webContentsId: number): number;
    /** Resets blocked count for a webContents (on navigation) */
    resetBlockedCount(webContentsId: number): void;
    /** Toggle ad blocking for a specific domain */
    toggleSiteAdBlocking(domain: string, enabled: boolean): void;
    /** Get current privacy settings */
    getSettings(): PrivacySettings;
    /** Update privacy settings */
    updateSettings(partial: Partial<PrivacySettings>): void;
    private saveSettings;
    /** Extract hostname from URL safely */
    private extractHostname;
    /** Map from webContentsId to current page domain */
    private tabDomains;
    updateTabDomain(webContentsId: number, url: string): void;
    getTabDomain(webContentsId: number): string | undefined;
}
export declare const privacyEngine: PrivacyEngine;
export default privacyEngine;
