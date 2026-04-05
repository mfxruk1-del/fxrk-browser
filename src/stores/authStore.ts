import { create } from 'zustand'
import type { Account, Profile, Credential } from '../../electron/utils/types'

interface AuthStore {
  accounts: Account[]
  profiles: Profile[]
  credentials: Credential[]
  activeProfileId: string

  setAccounts: (accounts: Account[]) => void
  addAccount: (account: Account) => void
  removeAccount: (id: string) => void
  setProfiles: (profiles: Profile[]) => void
  addProfile: (profile: Profile) => void
  removeProfile: (id: string) => void
  setActiveProfileId: (id: string) => void
  setCredentials: (creds: Credential[]) => void
  addCredential: (cred: Credential) => void
  removeCredential: (id: string) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  accounts: [],
  profiles: [],
  credentials: [],
  activeProfileId: 'default',

  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) => set((s) => ({ accounts: [...s.accounts, account] })),
  removeAccount: (id) => set((s) => ({ accounts: s.accounts.filter(a => a.id !== id) })),
  setProfiles: (profiles) => set({ profiles }),
  addProfile: (profile) => set((s) => ({ profiles: [...s.profiles, profile] })),
  removeProfile: (id) => set((s) => ({ profiles: s.profiles.filter(p => p.id !== id) })),
  setActiveProfileId: (activeProfileId) => set({ activeProfileId }),
  setCredentials: (credentials) => set({ credentials }),
  addCredential: (cred) => set((s) => ({ credentials: [...s.credentials, cred] })),
  removeCredential: (id) => set((s) => ({ credentials: s.credentials.filter(c => c.id !== id) })),
}))
