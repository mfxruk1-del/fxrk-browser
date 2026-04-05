import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import type { SMSMessage, SMSConversation, PhoneBridgeConfig, PhoneBridgeStatus } from '../utils/types';
declare class PhoneBridge extends EventEmitter {
    private browser;
    private page;
    private status;
    private conversations;
    private pollTimer;
    private sessionRestored;
    private mainWindow;
    setMainWindow(win: BrowserWindow): void;
    getStatus(): PhoneBridgeStatus;
    getConversations(): SMSConversation[];
    getMessages(conversationId: string): SMSMessage[];
    /** Connect to iCloud and open Messages */
    connect(config: PhoneBridgeConfig): Promise<void>;
    /** Find Chrome or Edge executable on the system */
    private findChromePath;
    /** Check if the current session is authenticated on iCloud */
    private checkLoggedIn;
    /** Perform iCloud login with Apple ID and App-Specific Password */
    private performLogin;
    /** Navigate to iCloud Messages */
    private openMessages;
    /** Load conversation list from iCloud Messages DOM */
    private loadConversations;
    /** Set up a MutationObserver in the page for real-time message detection */
    private setupMessageObserver;
    /** Handle a newly detected message */
    private handleNewMessage;
    /** Detect verification codes in a message text */
    private detectVerificationCode;
    /** Fallback polling in case MutationObserver fails */
    private startPolling;
    private stopPolling;
    /** Send an SMS reply via iCloud.com/messages */
    sendMessage(to: string, text: string): Promise<void>;
    /** Create an iCloud Note (to send content to iPhone) */
    sendToPhone(type: 'link' | 'note' | 'clipboard', content: string, title?: string): Promise<void>;
    /** Check iCloud Notes for content pushed from phone (clipboard sync) */
    checkPhoneClipboard(): Promise<string | null>;
    /** Save session cookies for persistence across restarts */
    private saveSession;
    /** Restore session cookies */
    private restoreSession;
    /** Provide 2FA code to the pending login flow */
    provide2FACode(code: string): void;
    /** Disconnect and cleanup */
    disconnect(): Promise<void>;
    private cleanup;
}
export declare const phoneBridge: PhoneBridge;
export default phoneBridge;
