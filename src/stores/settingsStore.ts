import { create } from 'zustand'
import type { AppSettings } from '../../electron/utils/types'

interface SettingsStore {
  settings: AppSettings | null
  loaded: boolean
  setSettings: (s: AppSettings) => void
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loaded: false,

  setSettings: (settings) => set({ settings, loaded: true }),

  updateSetting: (key, value) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, [key]: value } : null,
    })),
}))
