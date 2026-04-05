import { create } from 'zustand'
import type { PrivacySettings, PrivacyGrade } from '../../electron/utils/types'

interface PrivacyStore {
  settings: PrivacySettings | null
  tabGrades: Record<string, PrivacyGrade>
  tabBlockedCounts: Record<string, number>
  totalBlockedToday: number

  setSettings: (s: PrivacySettings) => void
  updateSettings: (partial: Partial<PrivacySettings>) => void
  setTabGrade: (tabId: string, grade: PrivacyGrade) => void
  setTabBlockedCount: (tabId: string, count: number) => void
  setTotalBlockedToday: (n: number) => void
  getActiveGrade: (tabId: string | null) => PrivacyGrade | null
}

const defaultSettings: PrivacySettings = {
  adBlockEnabled: true,
  trackerBlockEnabled: true,
  cookieBlockMode: 'third-party',
  cookieClearOnClose: false,
  fingerprintSpoof: true,
  httpsOnly: false,
  doHProvider: 'cloudflare',
  doHCustomUrl: '',
  jsEnabled: true,
  webRtcPolicy: 'default',
  referrerPolicy: 'strict-origin-when-cross-origin',
  siteSpecificAdBlock: {},
  siteSpecificJs: {},
  siteSpecificCookies: {},
}

export const usePrivacyStore = create<PrivacyStore>((set, get) => ({
  settings: null,
  tabGrades: {},
  tabBlockedCounts: {},
  totalBlockedToday: 0,

  setSettings: (settings) => set({ settings }),

  updateSettings: (partial) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...partial } : { ...defaultSettings, ...partial },
    })),

  setTabGrade: (tabId, grade) =>
    set((state) => ({ tabGrades: { ...state.tabGrades, [tabId]: grade } })),

  setTabBlockedCount: (tabId, count) =>
    set((state) => ({ tabBlockedCounts: { ...state.tabBlockedCounts, [tabId]: count } })),

  setTotalBlockedToday: (totalBlockedToday) => set({ totalBlockedToday }),

  getActiveGrade: (tabId) => {
    if (!tabId) return null
    return get().tabGrades[tabId] ?? null
  },
}))
