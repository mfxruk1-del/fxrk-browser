"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPhoneIPC = registerPhoneIPC;
const electron_1 = require("electron");
const PhoneBridge_1 = require("../services/PhoneBridge");
const DatabaseService_1 = require("../services/DatabaseService");
const constants_1 = require("../utils/constants");
const logger_1 = require("../utils/logger");
let clipboardSyncTimer = null;
function registerPhoneIPC(mainWindow) {
    // Set main window reference on bridge so it can send events
    PhoneBridge_1.phoneBridge.setMainWindow(mainWindow);
    // Forward bridge events to renderer
    PhoneBridge_1.phoneBridge.on('statusChange', (status) => {
        mainWindow.webContents.send('phone:statusChange', status);
    });
    PhoneBridge_1.phoneBridge.on('newMessage', (msg) => {
        mainWindow.webContents.send('phone:newMessage', msg);
    });
    PhoneBridge_1.phoneBridge.on('conversationsUpdated', (convs) => {
        mainWindow.webContents.send('phone:conversationsUpdated', convs);
    });
    PhoneBridge_1.phoneBridge.on('twoFactorRequired', () => {
        mainWindow.webContents.send('phone:2faRequired');
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PHONE_CONNECT, async (_, config) => {
        DatabaseService_1.db.savePhoneConfig(config);
        await PhoneBridge_1.phoneBridge.connect(config);
        return PhoneBridge_1.phoneBridge.getStatus();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PHONE_DISCONNECT, async () => {
        await PhoneBridge_1.phoneBridge.disconnect();
        stopClipboardSync();
        return true;
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PHONE_GET_STATUS, () => PhoneBridge_1.phoneBridge.getStatus());
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PHONE_GET_CONVERSATIONS, () => PhoneBridge_1.phoneBridge.getConversations());
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PHONE_GET_MESSAGES, (_, conversationId) => PhoneBridge_1.phoneBridge.getMessages(conversationId));
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PHONE_SEND_MESSAGE, async (_, to, text) => {
        await PhoneBridge_1.phoneBridge.sendMessage(to, text);
        return true;
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PHONE_SEND_LINK, async (_, url) => {
        await PhoneBridge_1.phoneBridge.sendToPhone('link', url, 'FXRK Link');
        return true;
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PHONE_SEND_NOTE, async (_, content, title) => {
        await PhoneBridge_1.phoneBridge.sendToPhone('note', content, title);
        return true;
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PHONE_SYNC_CLIPBOARD, async (_, direction) => {
        if (direction === 'toPhone') {
            const text = electron_1.clipboard.readText();
            if (text) {
                await PhoneBridge_1.phoneBridge.sendToPhone('clipboard', text);
            }
            return text;
        }
        else {
            const content = await PhoneBridge_1.phoneBridge.checkPhoneClipboard();
            if (content) {
                electron_1.clipboard.writeText(content);
            }
            return content;
        }
    });
    // 2FA code submission from renderer
    electron_1.ipcMain.on('phone:submit2FA', (_, code) => {
        PhoneBridge_1.phoneBridge.provide2FACode(code);
    });
    // Get saved phone config (without decrypted password)
    electron_1.ipcMain.handle('phone:getConfig', () => {
        const config = DatabaseService_1.db.getPhoneConfig();
        if (!config)
            return null;
        return {
            appleId: config.appleId,
            appSpecificPassword: '', // Never send decrypted password to renderer
            hasPassword: !!config.appSpecificPassword,
            lastConnected: config.lastConnected,
        };
    });
    // Auto-reconnect on startup if previously connected
    electron_1.ipcMain.handle('phone:autoReconnect', async () => {
        const config = DatabaseService_1.db.getPhoneConfig();
        if (!config || !config.appleId || !config.appSpecificPassword)
            return false;
        if (!config.lastConnected)
            return false;
        try {
            await PhoneBridge_1.phoneBridge.connect(config);
            return true;
        }
        catch {
            return false;
        }
    });
    // Start clipboard sync monitoring
    electron_1.ipcMain.on('phone:startClipboardSync', () => {
        startClipboardSync(mainWindow);
    });
    electron_1.ipcMain.on('phone:stopClipboardSync', () => {
        stopClipboardSync();
    });
    logger_1.logger.phone.info('Phone IPC handlers registered');
}
function startClipboardSync(mainWindow) {
    if (clipboardSyncTimer)
        return;
    clipboardSyncTimer = setInterval(async () => {
        if (!PhoneBridge_1.phoneBridge.getStatus().connected)
            return;
        const content = await PhoneBridge_1.phoneBridge.checkPhoneClipboard().catch(() => null);
        if (content) {
            electron_1.clipboard.writeText(content);
            mainWindow.webContents.send('phone:clipboardFromPhone', content);
        }
    }, constants_1.CLIPBOARD_SYNC_INTERVAL);
}
function stopClipboardSync() {
    if (clipboardSyncTimer) {
        clearInterval(clipboardSyncTimer);
        clipboardSyncTimer = null;
    }
}
//# sourceMappingURL=phone-ipc.js.map