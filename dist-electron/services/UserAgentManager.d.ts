import type { UserAgentSettings, UserAgentPreset } from '../utils/types';
declare class UserAgentManager {
    private settings;
    private presets;
    private currentSessionUA;
    constructor();
    private loadSettings;
    /** Re-load settings from DB (called after DB is initialized) */
    reloadSettings(): void;
    /** Get all built-in UA presets */
    getPresets(): UserAgentPreset[];
    /** Get the currently active default user agent string */
    getActiveUserAgent(): string;
    /** Get UA for a specific domain (site-specific rules take priority) */
    getUserAgentForDomain(domain: string): string | null;
    /** Apply the default UA to the Electron session */
    applyToSession(sess?: Electron.Session): void;
    /** Set per-request UA based on site-specific rules */
    applyRequestUA(sess?: Electron.Session): void;
    /** Update settings and reapply */
    updateSettings(partial: Partial<UserAgentSettings>): void;
    /** Set a per-site UA rule */
    setSiteRule(domain: string, uaId: string | null): void;
    getSettings(): UserAgentSettings;
    getCurrentUA(): string;
}
export declare const uaManager: UserAgentManager;
export default uaManager;
