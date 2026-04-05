import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Tab } from '../../electron/utils/types'

// ============================================================
// FXRK Browser - Browser State Store (Zustand)
// ============================================================

interface BrowserStore {
  tabs: Tab[]
  activeTabId: string | null
  isLoading: boolean
  findQuery: string
  findVisible: boolean
  splitScreen: boolean
  splitTabId: string | null
  verticalTabs: boolean
  readingMode: boolean
  isFullscreen: boolean

  // Actions
  setTabs: (tabs: Tab[]) => void
  addTab: (tab: Tab) => void
  updateTab: (id: string, updates: Partial<Tab>) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string | null) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  setFindQuery: (q: string) => void
  setFindVisible: (v: boolean) => void
  setSplitScreen: (v: boolean, splitTabId?: string) => void
  setVerticalTabs: (v: boolean) => void
  setReadingMode: (v: boolean) => void
  setFullscreen: (v: boolean) => void
  getActiveTab: () => Tab | undefined
}

export const useBrowserStore = create<BrowserStore>()(
  subscribeWithSelector((set, get) => ({
    tabs: [],
    activeTabId: null,
    isLoading: false,
    findQuery: '',
    findVisible: false,
    splitScreen: false,
    splitTabId: null,
    verticalTabs: false,
    readingMode: false,
    isFullscreen: false,

    setTabs: (tabs) => set({ tabs }),

    addTab: (tab) => set((state) => ({ tabs: [...state.tabs, tab] })),

    updateTab: (id, updates) =>
      set((state) => ({
        tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),

    removeTab: (id) =>
      set((state) => ({ tabs: state.tabs.filter((t) => t.id !== id) })),

    setActiveTab: (id) =>
      set((state) => ({
        activeTabId: id,
        tabs: state.tabs.map((t) => ({ ...t, isActive: t.id === id })),
      })),

    reorderTabs: (fromIndex, toIndex) =>
      set((state) => {
        const tabs = [...state.tabs]
        const [moved] = tabs.splice(fromIndex, 1)
        tabs.splice(toIndex, 0, moved)
        return { tabs }
      }),

    setFindQuery: (findQuery) => set({ findQuery }),
    setFindVisible: (findVisible) => set({ findVisible }),

    setSplitScreen: (splitScreen, splitTabId = null) =>
      set({ splitScreen, splitTabId: splitScreen ? splitTabId : null }),

    setVerticalTabs: (verticalTabs) => set({ verticalTabs }),
    setReadingMode: (readingMode) => set({ readingMode }),
    setFullscreen: (isFullscreen) => set({ isFullscreen }),

    getActiveTab: () => {
      const { tabs, activeTabId } = get()
      return tabs.find((t) => t.id === activeTabId)
    },
  }))
)
