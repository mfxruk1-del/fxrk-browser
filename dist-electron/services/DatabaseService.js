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
exports.db = void 0;
const Database = __importStar(require("better-sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const electron_1 = require("electron");
const logger_1 = require("../utils/logger");
const encryption_1 = require("../utils/encryption");
// ============================================================
// FXRK Browser - SQLite Database Service
// ============================================================
const USER_DATA = electron_1.app?.getPath('userData') || path.join(process.env.APPDATA || '', 'fxrk-browser');
const DB_PATH = path.join(USER_DATA, 'fxrk.db');
const MACHINE_KEY = (0, encryption_1.getMachineKey)();
class DatabaseService {
    db = null;
    /** Opens or creates the SQLite database, runs migrations */
    initialize() {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        const DB = Database.default || Database;
        this.db = new DB(DB_PATH);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.db.pragma('synchronous = NORMAL');
        this.runMigrations();
        logger_1.logger.db.info(`Database initialized at ${DB_PATH}`);
    }
    get conn() {
        if (!this.db)
            throw new Error('Database not initialized');
        return this.db;
    }
    /** Run all SQL schema migrations idempotently */
    runMigrations() {
        this.conn.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT NOT NULL DEFAULT '🦾',
        color TEXT NOT NULL DEFAULT '#00ff41',
        is_locked INTEGER NOT NULL DEFAULT 0,
        password_hash TEXT,
        created_at INTEGER NOT NULL,
        partition TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        favicon TEXT NOT NULL DEFAULT '',
        visited_at INTEGER NOT NULL,
        visit_count INTEGER NOT NULL DEFAULT 1,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_history_visited ON history(visited_at DESC);
      CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);

      CREATE TABLE IF NOT EXISTS bookmark_folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT REFERENCES bookmark_folders(id) ON DELETE CASCADE,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        favicon TEXT NOT NULL DEFAULT '',
        folder_id TEXT REFERENCES bookmark_folders(id) ON DELETE SET NULL,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]'
      );
      CREATE INDEX IF NOT EXISTS idx_bookmarks_domain ON bookmarks(url);

      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        domain TEXT NOT NULL,
        username TEXT NOT NULL,
        password_enc TEXT NOT NULL,
        notes_enc TEXT NOT NULL DEFAULT '',
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_used INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_credentials_domain ON credentials(domain);

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT NOT NULL,
        avatar_url TEXT NOT NULL DEFAULT '',
        access_token_enc TEXT NOT NULL,
        refresh_token_enc TEXT NOT NULL DEFAULT '',
        token_expiry INTEGER NOT NULL DEFAULT 0,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        provider_config_enc TEXT
      );

      CREATE TABLE IF NOT EXISTS containers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'blue',
        custom_color TEXT,
        icon TEXT NOT NULL DEFAULT '🔒',
        site_rules TEXT NOT NULL DEFAULT '[]',
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        domain TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_notes_url ON notes(url);

      CREATE TABLE IF NOT EXISTS site_zoom (
        domain TEXT PRIMARY KEY,
        zoom REAL NOT NULL DEFAULT 1.0
      );

      CREATE TABLE IF NOT EXISTS custom_filters (
        id TEXT PRIMARY KEY,
        pattern TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'block',
        enabled INTEGER NOT NULL DEFAULT 1,
        comment TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS downloads (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        filename TEXT NOT NULL,
        save_path TEXT NOT NULL,
        total_bytes INTEGER NOT NULL DEFAULT 0,
        received_bytes INTEGER NOT NULL DEFAULT 0,
        state TEXT NOT NULL DEFAULT 'progressing',
        paused INTEGER NOT NULL DEFAULT 0,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        mime_type TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS phone_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        apple_id TEXT NOT NULL DEFAULT '',
        password_enc TEXT NOT NULL DEFAULT '',
        session_cookies_enc TEXT DEFAULT NULL,
        last_connected INTEGER DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS phone_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        sender_name TEXT,
        text TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        is_outgoing INTEGER NOT NULL DEFAULT 0,
        has_verification_code INTEGER NOT NULL DEFAULT 0,
        verification_code TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_phone_messages_conv ON phone_messages(conversation_id, timestamp DESC);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS blocked_ads_stats (
        date TEXT NOT NULL,
        domain TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (date, domain)
      );

      CREATE TABLE IF NOT EXISTS closed_tabs (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        favicon TEXT NOT NULL DEFAULT '',
        closed_at INTEGER NOT NULL,
        profile_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tabs_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        profile_id TEXT NOT NULL
      );
    `);
        // Ensure default profile exists
        const profileCount = this.conn.prepare('SELECT COUNT(*) as n FROM profiles').get();
        if (profileCount.n === 0) {
            this.conn.prepare(`
        INSERT INTO profiles (id, name, avatar, color, is_locked, created_at, partition)
        VALUES ('default', 'Default', '🦾', '#00ff41', 0, ?, 'persist:default')
      `).run(Date.now());
        }
        // Ensure phone_config row exists
        const phoneCount = this.conn.prepare('SELECT COUNT(*) as n FROM phone_config').get();
        if (phoneCount.n === 0) {
            this.conn.prepare(`INSERT INTO phone_config (id, apple_id, password_enc) VALUES (1, '', '')`).run();
        }
        logger_1.logger.db.info('Migrations complete');
    }
    // ── History ──────────────────────────────────────────────
    addHistory(entry) {
        const existing = this.conn.prepare('SELECT id, visit_count FROM history WHERE url = ? AND profile_id = ?')
            .get(entry.url, entry.profileId);
        if (existing) {
            this.conn.prepare('UPDATE history SET title=?, favicon=?, visited_at=?, visit_count=? WHERE id=?')
                .run(entry.title, entry.favicon, entry.visitedAt, existing.visit_count + 1, existing.id);
        }
        else {
            this.conn.prepare(`
        INSERT INTO history (id, url, title, favicon, visited_at, visit_count, profile_id)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `).run(entry.id, entry.url, entry.title, entry.favicon, entry.visitedAt, entry.profileId);
        }
    }
    getHistory(profileId, limit = 200, offset = 0) {
        return this.conn.prepare(`
      SELECT id, url, title, favicon, visited_at as visitedAt, visit_count as visitCount, profile_id as profileId
      FROM history WHERE profile_id = ?
      ORDER BY visited_at DESC LIMIT ? OFFSET ?
    `).all(profileId, limit, offset);
    }
    searchHistory(profileId, query) {
        const q = `%${query}%`;
        return this.conn.prepare(`
      SELECT id, url, title, favicon, visited_at as visitedAt, visit_count as visitCount, profile_id as profileId
      FROM history WHERE profile_id = ? AND (url LIKE ? OR title LIKE ?)
      ORDER BY visited_at DESC LIMIT 100
    `).all(profileId, q, q);
    }
    clearHistory(profileId, before) {
        if (before) {
            this.conn.prepare('DELETE FROM history WHERE profile_id = ? AND visited_at < ?').run(profileId, before);
        }
        else {
            this.conn.prepare('DELETE FROM history WHERE profile_id = ?').run(profileId);
        }
    }
    deleteHistoryEntry(id) {
        this.conn.prepare('DELETE FROM history WHERE id = ?').run(id);
    }
    // ── Bookmarks ────────────────────────────────────────────
    addBookmark(bookmark) {
        this.conn.prepare(`
      INSERT OR REPLACE INTO bookmarks (id, url, title, favicon, folder_id, profile_id, created_at, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bookmark.id, bookmark.url, bookmark.title, bookmark.favicon, bookmark.folderId, bookmark.profileId, bookmark.createdAt, JSON.stringify(bookmark.tags));
    }
    getBookmarks(profileId) {
        return this.conn.prepare(`
      SELECT id, url, title, favicon, folder_id as folderId, profile_id as profileId, created_at as createdAt, tags
      FROM bookmarks WHERE profile_id = ? ORDER BY created_at ASC
    `).all(profileId)
            .map(b => ({ ...b, tags: JSON.parse(b.tags) }));
    }
    deleteBookmark(id) {
        this.conn.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
    }
    isBookmarked(url, profileId) {
        const row = this.conn.prepare('SELECT id FROM bookmarks WHERE url = ? AND profile_id = ?')
            .get(url, profileId);
        return row?.id ?? null;
    }
    addBookmarkFolder(folder) {
        this.conn.prepare(`
      INSERT OR REPLACE INTO bookmark_folders (id, name, parent_id, profile_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(folder.id, folder.name, folder.parentId, folder.profileId, folder.createdAt);
    }
    getBookmarkFolders(profileId) {
        return this.conn.prepare(`
      SELECT id, name, parent_id as parentId, profile_id as profileId, created_at as createdAt
      FROM bookmark_folders WHERE profile_id = ?
    `).all(profileId);
    }
    // ── Credentials (Encrypted) ──────────────────────────────
    saveCredential(cred) {
        const passwordEnc = (0, encryption_1.encrypt)(cred.password, MACHINE_KEY);
        const notesEnc = cred.notes ? (0, encryption_1.encrypt)(cred.notes, MACHINE_KEY) : '';
        this.conn.prepare(`
      INSERT OR REPLACE INTO credentials
        (id, url, domain, username, password_enc, notes_enc, profile_id, created_at, updated_at, last_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cred.id, cred.url, cred.domain, cred.username, passwordEnc, notesEnc, cred.profileId, cred.createdAt, cred.updatedAt, cred.lastUsed ?? null);
    }
    getCredentials(profileId) {
        const rows = this.conn.prepare(`
      SELECT id, url, domain, username, password_enc, notes_enc, profile_id as profileId,
             created_at as createdAt, updated_at as updatedAt, last_used as lastUsed
      FROM credentials WHERE profile_id = ?
    `).all(profileId);
        return rows.map(row => ({
            ...row,
            password: (0, encryption_1.decrypt)(row.password_enc, MACHINE_KEY),
            notes: row.notes_enc ? (0, encryption_1.decrypt)(row.notes_enc, MACHINE_KEY) : '',
        }));
    }
    getCredentialsByDomain(domain, profileId) {
        const rows = this.conn.prepare(`
      SELECT id, url, domain, username, password_enc, notes_enc, profile_id as profileId,
             created_at as createdAt, updated_at as updatedAt, last_used as lastUsed
      FROM credentials WHERE domain = ? AND profile_id = ?
    `).all(domain, profileId);
        return rows.map(row => ({
            ...row,
            password: (0, encryption_1.decrypt)(row.password_enc, MACHINE_KEY),
            notes: row.notes_enc ? (0, encryption_1.decrypt)(row.notes_enc, MACHINE_KEY) : '',
        }));
    }
    deleteCredential(id) {
        this.conn.prepare('DELETE FROM credentials WHERE id = ?').run(id);
    }
    // ── Accounts (OAuth tokens - encrypted) ──────────────────
    saveAccount(account) {
        const accessEnc = (0, encryption_1.encrypt)(account.accessToken, MACHINE_KEY);
        const refreshEnc = account.refreshToken ? (0, encryption_1.encrypt)(account.refreshToken, MACHINE_KEY) : '';
        const configEnc = account.providerConfig ? (0, encryption_1.encrypt)(JSON.stringify(account.providerConfig), MACHINE_KEY) : null;
        this.conn.prepare(`
      INSERT OR REPLACE INTO accounts
        (id, provider, email, display_name, avatar_url, access_token_enc, refresh_token_enc, token_expiry, profile_id, provider_config_enc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(account.id, account.provider, account.email, account.displayName, account.avatarUrl, accessEnc, refreshEnc, account.tokenExpiry, account.profileId, configEnc);
    }
    getAccounts(profileId) {
        const rows = this.conn.prepare(`
      SELECT id, provider, email, display_name as displayName, avatar_url as avatarUrl,
             access_token_enc, refresh_token_enc, token_expiry as tokenExpiry,
             profile_id as profileId, provider_config_enc
      FROM accounts WHERE profile_id = ?
    `).all(profileId);
        return rows.map(row => ({
            ...row,
            accessToken: (0, encryption_1.decrypt)(row.access_token_enc, MACHINE_KEY),
            refreshToken: row.refresh_token_enc ? (0, encryption_1.decrypt)(row.refresh_token_enc, MACHINE_KEY) : '',
            providerConfig: row.provider_config_enc
                ? JSON.parse((0, encryption_1.decrypt)(row.provider_config_enc, MACHINE_KEY))
                : undefined,
        }));
    }
    deleteAccount(id) {
        this.conn.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    }
    // ── Profiles ─────────────────────────────────────────────
    getProfiles() {
        return this.conn.prepare(`
      SELECT id, name, avatar, color, is_locked as isLocked, password_hash as passwordHash,
             created_at as createdAt, partition
      FROM profiles
    `).all();
    }
    saveProfile(profile) {
        this.conn.prepare(`
      INSERT OR REPLACE INTO profiles (id, name, avatar, color, is_locked, password_hash, created_at, partition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(profile.id, profile.name, profile.avatar, profile.color, profile.isLocked ? 1 : 0, profile.passwordHash ?? null, profile.createdAt, profile.partition);
    }
    deleteProfile(id) {
        if (id === 'default')
            throw new Error('Cannot delete default profile');
        this.conn.prepare('DELETE FROM profiles WHERE id = ?').run(id);
    }
    // ── Containers ────────────────────────────────────────────
    getContainers(profileId) {
        return this.conn.prepare(`
      SELECT id, name, color, custom_color as customColor, icon, site_rules as siteRules, profile_id as profileId
      FROM containers WHERE profile_id = ?
    `).all(profileId)
            .map(c => ({ ...c, siteRules: JSON.parse(c.siteRules) }));
    }
    saveContainer(container) {
        this.conn.prepare(`
      INSERT OR REPLACE INTO containers (id, name, color, custom_color, icon, site_rules, profile_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(container.id, container.name, container.color, container.customColor ?? null, container.icon, JSON.stringify(container.siteRules), container.profileId);
    }
    deleteContainer(id) {
        this.conn.prepare('DELETE FROM containers WHERE id = ?').run(id);
    }
    // ── Notes ─────────────────────────────────────────────────
    getNote(url, profileId) {
        return this.conn.prepare(`
      SELECT id, url, domain, content, created_at as createdAt, updated_at as updatedAt, profile_id as profileId
      FROM notes WHERE url = ? AND profile_id = ?
    `).get(url, profileId);
    }
    saveNote(note) {
        this.conn.prepare(`
      INSERT OR REPLACE INTO notes (id, url, domain, content, created_at, updated_at, profile_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(note.id, note.url, note.domain, note.content, note.createdAt, note.updatedAt, note.profileId);
    }
    deleteNote(id) {
        this.conn.prepare('DELETE FROM notes WHERE id = ?').run(id);
    }
    // ── Downloads ─────────────────────────────────────────────
    saveDownload(download) {
        this.conn.prepare(`
      INSERT OR REPLACE INTO downloads
        (id, url, filename, save_path, total_bytes, received_bytes, state, paused, started_at, completed_at, mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(download.id, download.url, download.filename, download.savePath, download.totalBytes, download.receivedBytes, download.state, download.paused ? 1 : 0, download.startedAt, download.completedAt ?? null, download.mimeType);
    }
    getDownloads() {
        return this.conn.prepare(`
      SELECT id, url, filename, save_path as savePath, total_bytes as totalBytes,
             received_bytes as receivedBytes, state, paused, started_at as startedAt,
             completed_at as completedAt, mime_type as mimeType
      FROM downloads ORDER BY started_at DESC LIMIT 100
    `).all()
            .map(d => ({ ...d, paused: d.paused === 1 }));
    }
    updateDownloadProgress(id, receivedBytes, state) {
        this.conn.prepare('UPDATE downloads SET received_bytes=?, state=? WHERE id=?')
            .run(receivedBytes, state, id);
    }
    // ── Phone Config (Encrypted) ──────────────────────────────
    savePhoneConfig(config) {
        const passEnc = config.appSpecificPassword ? (0, encryption_1.encrypt)(config.appSpecificPassword, MACHINE_KEY) : '';
        const cookiesEnc = config.sessionCookies ? (0, encryption_1.encrypt)(config.sessionCookies, MACHINE_KEY) : null;
        this.conn.prepare(`
      UPDATE phone_config SET apple_id=?, password_enc=?, session_cookies_enc=?, last_connected=? WHERE id=1
    `).run(config.appleId, passEnc, cookiesEnc, config.lastConnected ?? null);
    }
    getPhoneConfig() {
        const row = this.conn.prepare(`
      SELECT apple_id as appleId, password_enc, session_cookies_enc, last_connected as lastConnected
      FROM phone_config WHERE id=1
    `).get();
        if (!row || !row.appleId)
            return null;
        return {
            appleId: row.appleId,
            appSpecificPassword: row.password_enc ? (0, encryption_1.decrypt)(row.password_enc, MACHINE_KEY) : '',
            sessionCookies: row.session_cookies_enc ? (0, encryption_1.decrypt)(row.session_cookies_enc, MACHINE_KEY) : undefined,
            lastConnected: row.lastConnected ?? undefined,
        };
    }
    // ── App Settings ──────────────────────────────────────────
    getSetting(key, defaultValue) {
        const row = this.conn.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
        if (!row)
            return defaultValue;
        try {
            return JSON.parse(row.value);
        }
        catch {
            return defaultValue;
        }
    }
    setSetting(key, value) {
        this.conn.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
    }
    // ── Site Zoom ─────────────────────────────────────────────
    getSiteZoom(domain) {
        const row = this.conn.prepare('SELECT zoom FROM site_zoom WHERE domain = ?').get(domain);
        return row?.zoom ?? 1.0;
    }
    setSiteZoom(domain, zoom) {
        this.conn.prepare('INSERT OR REPLACE INTO site_zoom (domain, zoom) VALUES (?, ?)').run(domain, zoom);
    }
    // ── Blocked Ads Stats ─────────────────────────────────────
    recordBlockedRequest(domain) {
        const date = new Date().toISOString().split('T')[0];
        this.conn.prepare(`
      INSERT INTO blocked_ads_stats (date, domain, count) VALUES (?, ?, 1)
      ON CONFLICT(date, domain) DO UPDATE SET count = count + 1
    `).run(date, domain);
    }
    getBlockedCount(date) {
        const d = date || new Date().toISOString().split('T')[0];
        const row = this.conn.prepare('SELECT SUM(count) as total FROM blocked_ads_stats WHERE date = ?').get(d);
        return row?.total ?? 0;
    }
    // ── Custom Filters ────────────────────────────────────────
    getCustomFilters() {
        return this.conn.prepare(`
      SELECT id, pattern, type, enabled, comment FROM custom_filters
    `).all();
    }
    saveCustomFilter(filter) {
        this.conn.prepare(`
      INSERT OR REPLACE INTO custom_filters (id, pattern, type, enabled, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(filter.id, filter.pattern, filter.type, filter.enabled ? 1 : 0, filter.comment);
    }
    // ── Closed Tab History ────────────────────────────────────
    pushClosedTab(tabInfo) {
        this.conn.prepare(`
      INSERT INTO closed_tabs (id, url, title, favicon, closed_at, profile_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(tabInfo.id, tabInfo.url, tabInfo.title, tabInfo.favicon, Date.now(), tabInfo.profileId);
        // Keep only last 50 closed tabs
        this.conn.prepare(`
      DELETE FROM closed_tabs WHERE id NOT IN (
        SELECT id FROM closed_tabs ORDER BY closed_at DESC LIMIT 50
      )
    `).run();
    }
    popClosedTab(profileId) {
        const row = this.conn.prepare(`
      SELECT id, url, title FROM closed_tabs WHERE profile_id = ? ORDER BY closed_at DESC LIMIT 1
    `).get(profileId);
        if (!row)
            return null;
        this.conn.prepare('DELETE FROM closed_tabs WHERE id = ?').run(row.id);
        return { url: row.url, title: row.title };
    }
    // ── Sessions ──────────────────────────────────────────────
    saveSession(id, name, tabsJson, profileId) {
        this.conn.prepare(`
      INSERT OR REPLACE INTO sessions (id, name, tabs_json, created_at, profile_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, tabsJson, Date.now(), profileId);
    }
    getSession(id) {
        return this.conn.prepare('SELECT tabs_json as tabsJson FROM sessions WHERE id = ?').get(id);
    }
    getLastSession(profileId) {
        return this.conn.prepare(`
      SELECT tabs_json as tabsJson FROM sessions WHERE profile_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(profileId);
    }
    close() {
        this.db?.close();
        this.db = null;
    }
}
exports.db = new DatabaseService();
exports.default = exports.db;
//# sourceMappingURL=DatabaseService.js.map