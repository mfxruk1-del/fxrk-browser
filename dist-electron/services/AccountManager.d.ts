import type { Account, Profile, Credential, OAuthProviderConfig } from '../utils/types';
declare class AccountManager {
    private activeProfileId;
    private oauthStates;
    /** Get the currently active profile ID */
    getActiveProfileId(): string;
    getProfiles(): Profile[];
    createProfile(name: string, avatar?: string, color?: string): Profile;
    deleteProfile(id: string): void;
    switchProfile(id: string): void;
    lockProfile(id: string, password: string): void;
    unlockProfile(id: string, password: string): boolean;
    /**
     * Opens a popup window for OAuth login.
     * Returns the account info once authentication is complete.
     */
    loginWithOAuth(provider: string, config: OAuthProviderConfig): Promise<Account>;
    private handleOAuthCallback;
    private exchangeCodeForTokens;
    private fetchUserInfo;
    getAccounts(): Account[];
    removeAccount(id: string): void;
    getCredentials(): Credential[];
    getCredentialsForDomain(domain: string): Credential[];
    saveCredential(cred: Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'profileId'>): Credential;
    updateCredential(id: string, updates: Partial<Pick<Credential, 'username' | 'password' | 'notes'>>): void;
    deleteCredential(id: string): void;
}
export declare const accountManager: AccountManager;
export default accountManager;
