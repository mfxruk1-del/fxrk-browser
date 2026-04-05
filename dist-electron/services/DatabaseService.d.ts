import type { HistoryEntry, Bookmark, BookmarkFolder, Download, Credential, Profile, Container, Note, Account, PhoneBridgeConfig, CustomFilter } from '../utils/types';
declare class DatabaseService {
    private db;
    /** Opens or creates the SQLite database, runs migrations */
    initialize(): void;
    private get conn();
    /** Run all SQL schema migrations idempotently */
    private runMigrations;
    addHistory(entry: HistoryEntry): void;
    getHistory(profileId: string, limit?: number, offset?: number): HistoryEntry[];
    searchHistory(profileId: string, query: string): HistoryEntry[];
    clearHistory(profileId: string, before?: number): void;
    deleteHistoryEntry(id: string): void;
    addBookmark(bookmark: Bookmark): void;
    getBookmarks(profileId: string): Bookmark[];
    deleteBookmark(id: string): void;
    isBookmarked(url: string, profileId: string): string | null;
    addBookmarkFolder(folder: BookmarkFolder): void;
    getBookmarkFolders(profileId: string): BookmarkFolder[];
    saveCredential(cred: Credential): void;
    getCredentials(profileId: string): Credential[];
    getCredentialsByDomain(domain: string, profileId: string): Credential[];
    deleteCredential(id: string): void;
    saveAccount(account: Account): void;
    getAccounts(profileId: string): Account[];
    deleteAccount(id: string): void;
    getProfiles(): Profile[];
    saveProfile(profile: Profile): void;
    deleteProfile(id: string): void;
    getContainers(profileId: string): Container[];
    saveContainer(container: Container): void;
    deleteContainer(id: string): void;
    getNote(url: string, profileId: string): Note | null;
    saveNote(note: Note): void;
    deleteNote(id: string): void;
    saveDownload(download: Download): void;
    getDownloads(): Download[];
    updateDownloadProgress(id: string, receivedBytes: number, state: string): void;
    savePhoneConfig(config: PhoneBridgeConfig): void;
    getPhoneConfig(): PhoneBridgeConfig | null;
    getSetting<T>(key: string, defaultValue: T): T;
    setSetting(key: string, value: unknown): void;
    getSiteZoom(domain: string): number;
    setSiteZoom(domain: string, zoom: number): void;
    recordBlockedRequest(domain: string): void;
    getBlockedCount(date?: string): number;
    getCustomFilters(): CustomFilter[];
    saveCustomFilter(filter: CustomFilter): void;
    pushClosedTab(tabInfo: {
        id: string;
        url: string;
        title: string;
        favicon: string;
        profileId: string;
    }): void;
    popClosedTab(profileId: string): {
        url: string;
        title: string;
    } | null;
    saveSession(id: string, name: string, tabsJson: string, profileId: string): void;
    getSession(id: string): {
        tabsJson: string;
    } | null;
    getLastSession(profileId: string): {
        tabsJson: string;
    } | null;
    close(): void;
}
export declare const db: DatabaseService;
export default db;
