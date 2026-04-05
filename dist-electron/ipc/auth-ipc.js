"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthIPC = registerAuthIPC;
const electron_1 = require("electron");
const AccountManager_1 = require("../services/AccountManager");
const constants_1 = require("../utils/constants");
const logger_1 = require("../utils/logger");
const encryption_1 = require("../utils/encryption");
function registerAuthIPC() {
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.AUTH_GET_ACCOUNTS, () => AccountManager_1.accountManager.getAccounts());
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.AUTH_ADD_ACCOUNT, async (_, provider, config) => {
        try {
            return await AccountManager_1.accountManager.loginWithOAuth(provider, config);
        }
        catch (err) {
            throw new Error(`OAuth failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.AUTH_REMOVE_ACCOUNT, (_, id) => AccountManager_1.accountManager.removeAccount(id));
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.AUTH_GET_PROFILES, () => AccountManager_1.accountManager.getProfiles());
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.AUTH_SWITCH_PROFILE, (_, id) => AccountManager_1.accountManager.switchProfile(id));
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.AUTH_CREATE_PROFILE, (_, name, avatar, color) => AccountManager_1.accountManager.createProfile(name, avatar, color));
    electron_1.ipcMain.handle('profile:delete', (_, id) => AccountManager_1.accountManager.deleteProfile(id));
    electron_1.ipcMain.handle('profile:lock', (_, id, password) => AccountManager_1.accountManager.lockProfile(id, password));
    electron_1.ipcMain.handle('profile:unlock', (_, id, password) => AccountManager_1.accountManager.unlockProfile(id, password));
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.AUTH_GET_CREDENTIALS, () => AccountManager_1.accountManager.getCredentials());
    electron_1.ipcMain.handle('auth:getCredentialsForDomain', (_, domain) => AccountManager_1.accountManager.getCredentialsForDomain(domain));
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.AUTH_SAVE_CREDENTIAL, (_, cred) => AccountManager_1.accountManager.saveCredential(cred));
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.AUTH_DELETE_CREDENTIAL, (_, id) => AccountManager_1.accountManager.deleteCredential(id));
    electron_1.ipcMain.handle('auth:generatePassword', (_, length) => (0, encryption_1.generatePassword)(length));
    electron_1.ipcMain.handle('auth:getActiveProfile', () => AccountManager_1.accountManager.getActiveProfileId());
    logger_1.logger.auth.info('Auth IPC handlers registered');
}
//# sourceMappingURL=auth-ipc.js.map