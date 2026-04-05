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
exports.registerPrivacyIPC = registerPrivacyIPC;
const electron_1 = require("electron");
const PrivacyEngine_1 = require("../services/PrivacyEngine");
const UserAgentManager_1 = require("../services/UserAgentManager");
const DatabaseService_1 = require("../services/DatabaseService");
const constants_1 = require("../utils/constants");
const logger_1 = require("../utils/logger");
function registerPrivacyIPC() {
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PRIVACY_GET_SETTINGS, () => PrivacyEngine_1.privacyEngine.getSettings());
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PRIVACY_SET_SETTINGS, (_, partial) => {
        PrivacyEngine_1.privacyEngine.updateSettings(partial);
        return PrivacyEngine_1.privacyEngine.getSettings();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PRIVACY_GET_BLOCKED_COUNT, () => DatabaseService_1.db.getBlockedCount());
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PRIVACY_TOGGLE_SITE, (_, domain, adBlockEnabled) => {
        PrivacyEngine_1.privacyEngine.toggleSiteAdBlocking(domain, adBlockEnabled);
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PRIVACY_GET_GRADE, (_, url, blockedCount, isHTTPS) => PrivacyEngine_1.privacyEngine.getPrivacyGrade(url, blockedCount, isHTTPS));
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PRIVACY_CLEAR_COOKIES, async (_, partition) => {
        const { session } = await Promise.resolve().then(() => __importStar(require('electron')));
        const sess = partition ? session.fromPartition(partition) : session.defaultSession;
        await sess.clearStorageData({ storages: ['cookies'] });
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PRIVACY_GET_COOKIES, async (_, url, partition) => {
        const { session } = await Promise.resolve().then(() => __importStar(require('electron')));
        const sess = partition ? session.fromPartition(partition) : session.defaultSession;
        return sess.cookies.get({ url });
    });
    // User Agent
    electron_1.ipcMain.handle('ua:getSettings', () => UserAgentManager_1.uaManager.getSettings());
    electron_1.ipcMain.handle('ua:getPresets', () => UserAgentManager_1.uaManager.getPresets());
    electron_1.ipcMain.handle('ua:updateSettings', (_, partial) => UserAgentManager_1.uaManager.updateSettings(partial));
    electron_1.ipcMain.handle('ua:setSiteRule', (_, domain, uaId) => UserAgentManager_1.uaManager.setSiteRule(domain, uaId));
    // Custom filters
    electron_1.ipcMain.handle('filters:get', () => DatabaseService_1.db.getCustomFilters());
    electron_1.ipcMain.handle('filters:save', (_, filter) => DatabaseService_1.db.saveCustomFilter(filter));
    // DoH settings stored in DB
    electron_1.ipcMain.handle('doh:getConfig', () => DatabaseService_1.db.getSetting('doh', { provider: 'cloudflare' }));
    electron_1.ipcMain.handle('doh:setConfig', (_, config) => DatabaseService_1.db.setSetting('doh', config));
    logger_1.logger.privacy.info('Privacy IPC handlers registered');
}
//# sourceMappingURL=privacy-ipc.js.map